-- Airtable-style grid interactions: stable row ordering, comments, duplication,
-- field reordering, and recoverable table/field removal.

alter table public.data_records add column position numeric(20, 6);

update public.data_records
set position = record_number * 1024;

create function private.assign_data_record_position()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.position is null then
    select coalesce(max(record.position), 0) + 1024
      into new.position
    from public.data_records as record
    where record.table_id = new.table_id and record.archived_at is null;
  end if;
  return new;
end;
$$;

revoke all on function private.assign_data_record_position() from public, anon, authenticated;

create trigger data_records_assign_position
before insert on public.data_records
for each row execute function private.assign_data_record_position();

alter table public.data_records alter column position set not null;

create index data_records_table_position_idx
  on public.data_records(table_id, position, record_number)
  where archived_at is null;

create table public.data_record_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  table_id uuid not null,
  record_id uuid not null,
  body text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  foreign key (project_id, table_id) references public.data_tables(project_id, id) on delete cascade,
  foreign key (table_id, record_id) references public.data_records(table_id, id) on delete cascade,
  constraint data_record_comment_body_length check (length(btrim(body)) between 1 and 4000)
);

create index data_record_comments_record_time_idx
  on public.data_record_comments(record_id, created_at);

alter table public.data_record_comments enable row level security;
alter table public.data_record_comments force row level security;

create policy data_record_comments_read_member
on public.data_record_comments for select to authenticated
using (private.has_project_role(project_id, array['owner', 'editor', 'read_only']));

revoke all on public.data_record_comments from anon, authenticated;
grant select on public.data_record_comments to authenticated;

create function public.create_positioned_data_record(
  p_project_id uuid,
  p_table_id uuid,
  p_values jsonb,
  p_links jsonb,
  p_anchor_record_id uuid,
  p_placement text,
  p_idempotency_key uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_project_editor(p_project_id);
  v_id uuid := gen_random_uuid();
  v_hash text;
  v_replay boolean;
  v_existing_id uuid;
  v_anchor_position numeric(20, 6);
  v_neighbor_position numeric(20, 6);
  v_position numeric(20, 6);
begin
  if p_placement not in ('above', 'below') then
    raise exception using errcode = '22023', message = 'Placement must be above or below.';
  end if;

  perform 1 from public.data_tables
  where id = p_table_id and project_id = p_project_id and archived_at is null;
  if not found then
    raise exception using errcode = '22023', message = 'Active table was not found.';
  end if;

  v_hash := encode(extensions.digest(convert_to(jsonb_build_object(
    'project_id', p_project_id,
    'table_id', p_table_id,
    'anchor_record_id', p_anchor_record_id,
    'placement', p_placement,
    'values', coalesce(p_values, '{}'::jsonb),
    'links', coalesce(p_links, '{}'::jsonb)
  )::text, 'UTF8'), 'sha256'), 'hex');

  select replay, existing_result_id into v_replay, v_existing_id
  from private.begin_idempotent_command(p_project_id, 'data_record.create_positioned', p_idempotency_key, v_hash);
  if v_replay then return v_existing_id; end if;

  select record.position into v_anchor_position
  from public.data_records as record
  where record.id = p_anchor_record_id
    and record.project_id = p_project_id
    and record.table_id = p_table_id
    and record.archived_at is null
  for update;
  if not found then
    raise exception using errcode = '22023', message = 'The selected row is no longer available.';
  end if;

  if p_placement = 'above' then
    select max(record.position) into v_neighbor_position
    from public.data_records as record
    where record.table_id = p_table_id
      and record.archived_at is null
      and record.position < v_anchor_position;
    v_position := case
      when v_neighbor_position is null then v_anchor_position - 1024
      else (v_neighbor_position + v_anchor_position) / 2
    end;
  else
    select min(record.position) into v_neighbor_position
    from public.data_records as record
    where record.table_id = p_table_id
      and record.archived_at is null
      and record.position > v_anchor_position;
    v_position := case
      when v_neighbor_position is null then v_anchor_position + 1024
      else (v_anchor_position + v_neighbor_position) / 2
    end;
  end if;

  insert into public.data_records(id, project_id, table_id, position, created_by, updated_by)
  values (v_id, p_project_id, p_table_id, v_position, v_actor, v_actor);

  perform private.write_data_record_values(
    p_project_id,
    p_table_id,
    v_id,
    v_actor,
    coalesce(p_values, '{}'::jsonb),
    coalesce(p_links, '{}'::jsonb)
  );

  insert into public.audit_events(
    project_id, actor_user_id, action, entity_type, entity_id, request_id, after_state
  ) values (
    p_project_id,
    v_actor,
    'data_record.created',
    'data_record',
    v_id,
    p_idempotency_key,
    jsonb_build_object(
      'table_id', p_table_id,
      'anchor_record_id', p_anchor_record_id,
      'placement', p_placement,
      'position', v_position
    )
  );
  perform private.complete_idempotent_command('data_record.create_positioned', p_idempotency_key, v_id);
  return v_id;
end;
$$;

create function public.duplicate_data_record(
  p_project_id uuid,
  p_record_id uuid,
  p_idempotency_key uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_project_editor(p_project_id);
  v_source public.data_records%rowtype;
  v_id uuid := gen_random_uuid();
  v_hash text;
  v_replay boolean;
  v_existing_id uuid;
  v_next_position numeric(20, 6);
  v_position numeric(20, 6);
begin
  v_hash := encode(extensions.digest(convert_to(jsonb_build_object(
    'project_id', p_project_id, 'record_id', p_record_id
  )::text, 'UTF8'), 'sha256'), 'hex');
  select replay, existing_result_id into v_replay, v_existing_id
  from private.begin_idempotent_command(p_project_id, 'data_record.duplicate', p_idempotency_key, v_hash);
  if v_replay then return v_existing_id; end if;

  select * into v_source
  from public.data_records
  where id = p_record_id and project_id = p_project_id and archived_at is null
  for update;
  if v_source.id is null then
    raise exception using errcode = '22023', message = 'Active record was not found.';
  end if;

  select min(record.position) into v_next_position
  from public.data_records as record
  where record.table_id = v_source.table_id
    and record.archived_at is null
    and record.position > v_source.position;
  v_position := case
    when v_next_position is null then v_source.position + 1024
    else (v_source.position + v_next_position) / 2
  end;

  insert into public.data_records(id, project_id, table_id, position, created_by, updated_by)
  values (v_id, p_project_id, v_source.table_id, v_position, v_actor, v_actor);

  insert into public.data_cells(
    project_id, table_id, record_id, field_id,
    text_value, number_value, boolean_value, date_value, option_value, json_value,
    created_by, updated_by
  )
  select
    cell.project_id, cell.table_id, v_id, cell.field_id,
    cell.text_value, cell.number_value, cell.boolean_value, cell.date_value, cell.option_value, cell.json_value,
    v_actor, v_actor
  from public.data_cells as cell
  join public.data_fields as field on field.id = cell.field_id and field.archived_at is null
  where cell.record_id = p_record_id;

  insert into public.data_record_links(
    project_id, field_id, source_record_id, target_record_id, position, created_by
  )
  select link.project_id, link.field_id, v_id, link.target_record_id, link.position, v_actor
  from public.data_record_links as link
  join public.data_fields as field on field.id = link.field_id and field.archived_at is null
  join public.data_records as target on target.id = link.target_record_id and target.archived_at is null
  where link.source_record_id = p_record_id;

  insert into public.audit_events(
    project_id, actor_user_id, action, entity_type, entity_id, request_id, after_state
  ) values (
    p_project_id, v_actor, 'data_record.duplicated', 'data_record', v_id, p_idempotency_key,
    jsonb_build_object('source_record_id', p_record_id, 'table_id', v_source.table_id, 'position', v_position)
  );
  perform private.complete_idempotent_command('data_record.duplicate', p_idempotency_key, v_id);
  return v_id;
end;
$$;

create function public.reorder_data_fields(
  p_project_id uuid,
  p_table_id uuid,
  p_ordered_field_ids uuid[],
  p_idempotency_key uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_project_editor(p_project_id);
  v_hash text;
  v_replay boolean;
  v_existing_id uuid;
  v_active_count integer;
begin
  select count(*) into v_active_count
  from public.data_fields
  where table_id = p_table_id and project_id = p_project_id and archived_at is null;

  if v_active_count = 0
     or cardinality(p_ordered_field_ids) <> v_active_count
     or (select count(distinct field_id) from unnest(p_ordered_field_ids) as field_id) <> v_active_count
     or exists (
       select 1 from unnest(p_ordered_field_ids) as requested(field_id)
       where not exists (
         select 1 from public.data_fields as field
         where field.id = requested.field_id
           and field.table_id = p_table_id
           and field.project_id = p_project_id
           and field.archived_at is null
       )
     ) then
    raise exception using errcode = '22023', message = 'Field order must contain every active field exactly once.';
  end if;

  v_hash := encode(extensions.digest(convert_to(jsonb_build_object(
    'project_id', p_project_id, 'table_id', p_table_id, 'field_ids', p_ordered_field_ids
  )::text, 'UTF8'), 'sha256'), 'hex');
  select replay, existing_result_id into v_replay, v_existing_id
  from private.begin_idempotent_command(p_project_id, 'data_field.reorder', p_idempotency_key, v_hash);
  if v_replay then return v_existing_id; end if;

  update public.data_fields as field
  set position = requested.ordinality - 1,
      updated_at = now()
  from unnest(p_ordered_field_ids) with ordinality as requested(field_id, ordinality)
  where field.id = requested.field_id
    and field.project_id = p_project_id
    and field.table_id = p_table_id;

  insert into public.audit_events(
    project_id, actor_user_id, action, entity_type, entity_id, request_id, after_state
  ) values (
    p_project_id, v_actor, 'data_fields.reordered', 'data_table', p_table_id, p_idempotency_key,
    jsonb_build_object('field_ids', p_ordered_field_ids)
  );
  perform private.complete_idempotent_command('data_field.reorder', p_idempotency_key, p_table_id);
  return p_table_id;
end;
$$;

create function public.archive_data_field(
  p_project_id uuid,
  p_field_id uuid,
  p_idempotency_key uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_project_editor(p_project_id);
  v_field public.data_fields%rowtype;
  v_hash text;
  v_replay boolean;
  v_existing_id uuid;
begin
  v_hash := encode(extensions.digest(convert_to(jsonb_build_object(
    'project_id', p_project_id, 'field_id', p_field_id
  )::text, 'UTF8'), 'sha256'), 'hex');
  select replay, existing_result_id into v_replay, v_existing_id
  from private.begin_idempotent_command(p_project_id, 'data_field.archive', p_idempotency_key, v_hash);
  if v_replay then return v_existing_id; end if;

  select * into v_field
  from public.data_fields
  where id = p_field_id and project_id = p_project_id and archived_at is null
  for update;
  if v_field.id is null then
    raise exception using errcode = '22023', message = 'Active field was not found.';
  end if;
  if v_field.is_primary then
    raise exception using errcode = '23514', message = 'The primary field cannot be deleted.';
  end if;
  if exists (
    select 1 from public.data_fields as dependent
    where dependent.project_id = p_project_id
      and dependent.archived_at is null
      and (
        dependent.lookup_link_field_id = p_field_id
        or dependent.lookup_target_field_id = p_field_id
        or coalesce(dependent.config -> 'sourceFieldIds', '[]'::jsonb) ? p_field_id::text
      )
  ) then
    raise exception using errcode = '23514', message = 'Delete dependent lookup or formula fields before deleting this field.';
  end if;

  delete from public.data_record_links where field_id = p_field_id;
  delete from public.data_form_fields where field_id = p_field_id;
  update public.data_interface_blocks set field_id = null where field_id = p_field_id;
  update public.data_fields
  set archived_at = now(), updated_at = now()
  where id = p_field_id;

  insert into public.audit_events(
    project_id, actor_user_id, action, entity_type, entity_id, request_id, before_state
  ) values (
    p_project_id, v_actor, 'data_field.archived', 'data_field', p_field_id, p_idempotency_key,
    jsonb_build_object('table_id', v_field.table_id, 'name', v_field.name, 'field_type', v_field.field_type)
  );
  perform private.complete_idempotent_command('data_field.archive', p_idempotency_key, p_field_id);
  return p_field_id;
end;
$$;

create function public.archive_data_table(
  p_project_id uuid,
  p_table_id uuid,
  p_idempotency_key uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_project_editor(p_project_id);
  v_table public.data_tables%rowtype;
  v_hash text;
  v_replay boolean;
  v_existing_id uuid;
begin
  v_hash := encode(extensions.digest(convert_to(jsonb_build_object(
    'project_id', p_project_id, 'table_id', p_table_id
  )::text, 'UTF8'), 'sha256'), 'hex');
  select replay, existing_result_id into v_replay, v_existing_id
  from private.begin_idempotent_command(p_project_id, 'data_table.archive', p_idempotency_key, v_hash);
  if v_replay then return v_existing_id; end if;

  select * into v_table
  from public.data_tables
  where id = p_table_id and project_id = p_project_id and archived_at is null
  for update;
  if v_table.id is null then
    raise exception using errcode = '22023', message = 'Active table was not found.';
  end if;
  if exists (
    select 1 from public.data_fields as field
    where field.project_id = p_project_id
      and field.table_id <> p_table_id
      and field.archived_at is null
      and (
        field.linked_table_id = p_table_id
        or field.lookup_target_field_id in (
          select target.id from public.data_fields as target where target.table_id = p_table_id
        )
      )
  ) then
    raise exception using errcode = '23514', message = 'Remove fields in other tables that link to this table before deleting it.';
  end if;

  delete from public.data_record_links
  where source_record_id in (select id from public.data_records where table_id = p_table_id)
     or target_record_id in (select id from public.data_records where table_id = p_table_id);
  delete from public.data_interface_blocks where table_id = p_table_id;
  update public.data_forms set archived_at = now(), updated_at = now()
  where table_id = p_table_id and archived_at is null;
  update public.data_views set archived_at = now(), updated_at = now()
  where table_id = p_table_id and archived_at is null;
  update public.data_records set archived_at = now(), updated_by = v_actor
  where table_id = p_table_id and archived_at is null;
  update public.data_fields set archived_at = now(), updated_at = now()
  where table_id = p_table_id and archived_at is null;
  update public.data_tables set archived_at = now(), updated_at = now()
  where id = p_table_id;

  insert into public.audit_events(
    project_id, actor_user_id, action, entity_type, entity_id, request_id, before_state
  ) values (
    p_project_id, v_actor, 'data_table.archived', 'data_table', p_table_id, p_idempotency_key,
    jsonb_build_object('name', v_table.name)
  );
  perform private.complete_idempotent_command('data_table.archive', p_idempotency_key, p_table_id);
  return p_table_id;
end;
$$;

create function public.create_data_record_comment(
  p_project_id uuid,
  p_record_id uuid,
  p_body text,
  p_idempotency_key uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_project_editor(p_project_id);
  v_record public.data_records%rowtype;
  v_id uuid := gen_random_uuid();
  v_hash text;
  v_replay boolean;
  v_existing_id uuid;
begin
  if length(btrim(coalesce(p_body, ''))) not between 1 and 4000 then
    raise exception using errcode = '22023', message = 'Comment must be between 1 and 4000 characters.';
  end if;

  select * into v_record from public.data_records
  where id = p_record_id and project_id = p_project_id and archived_at is null;
  if v_record.id is null then
    raise exception using errcode = '22023', message = 'Active record was not found.';
  end if;

  v_hash := encode(extensions.digest(convert_to(jsonb_build_object(
    'project_id', p_project_id, 'record_id', p_record_id, 'body', btrim(p_body)
  )::text, 'UTF8'), 'sha256'), 'hex');
  select replay, existing_result_id into v_replay, v_existing_id
  from private.begin_idempotent_command(p_project_id, 'data_record.comment', p_idempotency_key, v_hash);
  if v_replay then return v_existing_id; end if;

  insert into public.data_record_comments(id, project_id, table_id, record_id, body, created_by)
  values (v_id, p_project_id, v_record.table_id, p_record_id, btrim(p_body), v_actor);
  insert into public.audit_events(
    project_id, actor_user_id, action, entity_type, entity_id, request_id, after_state
  ) values (
    p_project_id, v_actor, 'data_record.commented', 'data_record_comment', v_id, p_idempotency_key,
    jsonb_build_object('record_id', p_record_id, 'table_id', v_record.table_id)
  );
  perform private.complete_idempotent_command('data_record.comment', p_idempotency_key, v_id);
  return v_id;
end;
$$;

revoke all on function public.create_positioned_data_record(uuid, uuid, jsonb, jsonb, uuid, text, uuid) from public, anon;
revoke all on function public.duplicate_data_record(uuid, uuid, uuid) from public, anon;
revoke all on function public.reorder_data_fields(uuid, uuid, uuid[], uuid) from public, anon;
revoke all on function public.archive_data_field(uuid, uuid, uuid) from public, anon;
revoke all on function public.archive_data_table(uuid, uuid, uuid) from public, anon;
revoke all on function public.create_data_record_comment(uuid, uuid, text, uuid) from public, anon;

grant execute on function public.create_positioned_data_record(uuid, uuid, jsonb, jsonb, uuid, text, uuid) to authenticated;
grant execute on function public.duplicate_data_record(uuid, uuid, uuid) to authenticated;
grant execute on function public.reorder_data_fields(uuid, uuid, uuid[], uuid) to authenticated;
grant execute on function public.archive_data_field(uuid, uuid, uuid) to authenticated;
grant execute on function public.archive_data_table(uuid, uuid, uuid) to authenticated;
grant execute on function public.create_data_record_comment(uuid, uuid, text, uuid) to authenticated;

comment on column public.data_records.position is 'Fractional ordering key used for insertion above and below existing records.';
comment on table public.data_record_comments is 'Audited discussion attached to configurable data records.';
