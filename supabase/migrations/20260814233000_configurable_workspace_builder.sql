-- Metadata-driven workspace builder. A project acts as a configurable base with
-- tables, typed fields, records, linked-record relationships, views, forms, and
-- interfaces. Construction is installed as a starter configuration on top.

create table public.data_tables (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  description text,
  color text not null default 'blue',
  position integer not null default 0,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (project_id, id),
  constraint data_table_name_length check (length(btrim(name)) between 1 and 120),
  constraint data_table_description_length check (description is null or length(description) <= 500),
  constraint data_table_color check (color in ('blue', 'cyan', 'green', 'amber', 'orange', 'violet', 'rose', 'slate')),
  constraint data_table_position_nonnegative check (position >= 0)
);

create unique index data_tables_project_name_active_idx
  on public.data_tables(project_id, lower(name)) where archived_at is null;
create index data_tables_project_position_idx
  on public.data_tables(project_id, position, created_at) where archived_at is null;

create table public.data_fields (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  table_id uuid not null,
  name text not null,
  field_type text not null,
  position integer not null default 0,
  is_primary boolean not null default false,
  is_required boolean not null default false,
  config jsonb not null default '{}'::jsonb,
  linked_table_id uuid,
  lookup_link_field_id uuid,
  lookup_target_field_id uuid,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (project_id, id),
  foreign key (project_id, table_id) references public.data_tables(project_id, id) on delete cascade,
  foreign key (project_id, linked_table_id) references public.data_tables(project_id, id),
  constraint data_field_name_length check (length(btrim(name)) between 1 and 120),
  constraint data_field_type check (field_type in (
    'text', 'long_text', 'number', 'currency', 'date', 'checkbox',
    'single_select', 'multi_select', 'email', 'phone', 'url',
    'link', 'lookup', 'formula'
  )),
  constraint data_field_position_nonnegative check (position >= 0),
  constraint data_field_config_object check (jsonb_typeof(config) = 'object'),
  constraint data_field_link_target check (
    (field_type = 'link' and linked_table_id is not null)
    or (field_type <> 'link' and linked_table_id is null)
  ),
  constraint data_field_lookup_sources check (
    (field_type = 'lookup' and lookup_link_field_id is not null and lookup_target_field_id is not null)
    or (field_type <> 'lookup' and lookup_link_field_id is null and lookup_target_field_id is null)
  ),
  constraint data_primary_field_type check (not is_primary or field_type = 'text')
);

alter table public.data_fields
  add constraint data_fields_lookup_link_field_fk foreign key (lookup_link_field_id)
  references public.data_fields(id),
  add constraint data_fields_lookup_target_field_fk foreign key (lookup_target_field_id)
  references public.data_fields(id);

create unique index data_fields_table_name_active_idx
  on public.data_fields(table_id, lower(name)) where archived_at is null;
create unique index data_fields_one_primary_per_table_idx
  on public.data_fields(table_id) where is_primary and archived_at is null;
create index data_fields_table_position_idx
  on public.data_fields(table_id, position, created_at) where archived_at is null;

create table public.data_records (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  table_id uuid not null,
  record_number bigint generated always as identity,
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (project_id, id),
  unique (table_id, id),
  foreign key (project_id, table_id) references public.data_tables(project_id, id) on delete cascade
);

create index data_records_table_time_idx
  on public.data_records(table_id, created_at, record_number) where archived_at is null;

create table public.data_cells (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  table_id uuid not null,
  record_id uuid not null,
  field_id uuid not null,
  text_value text,
  number_value numeric,
  boolean_value boolean,
  date_value date,
  option_value text,
  json_value jsonb,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now(),
  unique (record_id, field_id),
  foreign key (project_id, table_id) references public.data_tables(project_id, id) on delete cascade,
  foreign key (table_id, record_id) references public.data_records(table_id, id) on delete cascade,
  foreign key (project_id, field_id) references public.data_fields(project_id, id) on delete cascade,
  constraint data_cell_one_typed_value check (num_nonnulls(
    text_value, number_value, boolean_value, date_value, option_value, json_value
  ) = 1),
  constraint data_cell_text_length check (text_value is null or length(text_value) <= 20000),
  constraint data_cell_option_length check (option_value is null or length(option_value) <= 200),
  constraint data_cell_json_shape check (json_value is null or jsonb_typeof(json_value) in ('array', 'object'))
);

create index data_cells_table_record_idx on public.data_cells(table_id, record_id);
create index data_cells_field_idx on public.data_cells(field_id);

create table public.data_record_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  field_id uuid not null,
  source_record_id uuid not null,
  target_record_id uuid not null,
  position integer not null default 0,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (field_id, source_record_id, target_record_id),
  foreign key (project_id, field_id) references public.data_fields(project_id, id) on delete cascade,
  foreign key (project_id, source_record_id) references public.data_records(project_id, id) on delete cascade,
  foreign key (project_id, target_record_id) references public.data_records(project_id, id) on delete cascade,
  constraint data_record_link_position_nonnegative check (position >= 0),
  constraint data_record_link_not_self check (source_record_id <> target_record_id)
);

create index data_record_links_source_idx on public.data_record_links(source_record_id, field_id, position);
create index data_record_links_target_idx on public.data_record_links(target_record_id);

create table public.data_views (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  table_id uuid not null,
  name text not null,
  view_type text not null default 'grid',
  position integer not null default 0,
  filters jsonb not null default '[]'::jsonb,
  sorts jsonb not null default '[]'::jsonb,
  hidden_field_ids uuid[] not null default '{}'::uuid[],
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (project_id, id),
  foreign key (project_id, table_id) references public.data_tables(project_id, id) on delete cascade,
  constraint data_view_name_length check (length(btrim(name)) between 1 and 120),
  constraint data_view_type check (view_type in ('grid', 'list', 'gallery')),
  constraint data_view_position_nonnegative check (position >= 0),
  constraint data_view_filters_array check (jsonb_typeof(filters) = 'array'),
  constraint data_view_sorts_array check (jsonb_typeof(sorts) = 'array')
);

create unique index data_views_table_name_active_idx
  on public.data_views(table_id, lower(name)) where archived_at is null;

create table public.data_forms (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  table_id uuid not null,
  name text not null,
  description text,
  submit_label text not null default 'Submit',
  status text not null default 'published',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (project_id, id),
  foreign key (project_id, table_id) references public.data_tables(project_id, id) on delete cascade,
  constraint data_form_name_length check (length(btrim(name)) between 1 and 120),
  constraint data_form_description_length check (description is null or length(description) <= 1000),
  constraint data_form_submit_label_length check (length(btrim(submit_label)) between 1 and 80),
  constraint data_form_status check (status in ('draft', 'published', 'closed'))
);

create unique index data_forms_project_name_active_idx
  on public.data_forms(project_id, lower(name)) where archived_at is null;

create table public.data_form_fields (
  form_id uuid not null references public.data_forms(id) on delete cascade,
  field_id uuid not null references public.data_fields(id) on delete cascade,
  position integer not null default 0,
  is_required boolean not null default false,
  is_hidden boolean not null default false,
  help_text text,
  primary key (form_id, field_id),
  constraint data_form_field_position_nonnegative check (position >= 0),
  constraint data_form_field_help_length check (help_text is null or length(help_text) <= 500)
);

create table public.data_interfaces (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  description text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (project_id, id),
  constraint data_interface_name_length check (length(btrim(name)) between 1 and 120),
  constraint data_interface_description_length check (description is null or length(description) <= 1000)
);

create unique index data_interfaces_project_name_active_idx
  on public.data_interfaces(project_id, lower(name)) where archived_at is null;

create table public.data_interface_blocks (
  id uuid primary key default gen_random_uuid(),
  interface_id uuid not null references public.data_interfaces(id) on delete cascade,
  table_id uuid references public.data_tables(id) on delete cascade,
  field_id uuid references public.data_fields(id) on delete set null,
  name text not null,
  block_type text not null,
  position integer not null default 0,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint data_interface_block_name_length check (length(btrim(name)) between 1 and 120),
  constraint data_interface_block_type check (block_type in ('record_count', 'number_summary', 'record_list')),
  constraint data_interface_block_position_nonnegative check (position >= 0),
  constraint data_interface_block_config_object check (jsonb_typeof(config) = 'object')
);

create function private.validate_data_cell()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_record_table uuid;
  v_field public.data_fields%rowtype;
begin
  select table_id into v_record_table from public.data_records
  where id = new.record_id and project_id = new.project_id and archived_at is null;
  select * into v_field from public.data_fields
  where id = new.field_id and project_id = new.project_id and archived_at is null;

  if v_record_table is null or v_field.id is null or v_record_table <> new.table_id or v_field.table_id <> new.table_id then
    raise exception using errcode = '23514', message = 'Cell field and record must belong to the same active table.';
  end if;
  if v_field.field_type in ('link', 'lookup', 'formula') then
    raise exception using errcode = '23514', message = 'Linked and computed fields cannot store direct cell values.';
  end if;
  return new;
end;
$$;

revoke all on function private.validate_data_cell() from public, anon, authenticated;

create trigger data_cells_validate before insert or update on public.data_cells
for each row execute function private.validate_data_cell();

create function private.validate_data_record_link()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_field public.data_fields%rowtype;
  v_source_table uuid;
  v_target_table uuid;
begin
  select * into v_field from public.data_fields
  where id = new.field_id and project_id = new.project_id and archived_at is null;
  select table_id into v_source_table from public.data_records
  where id = new.source_record_id and project_id = new.project_id and archived_at is null;
  select table_id into v_target_table from public.data_records
  where id = new.target_record_id and project_id = new.project_id and archived_at is null;

  if v_field.id is null or v_field.field_type <> 'link'
     or v_field.table_id <> v_source_table or v_field.linked_table_id <> v_target_table then
    raise exception using errcode = '23514', message = 'Linked records must follow the configured field relationship.';
  end if;
  return new;
end;
$$;

revoke all on function private.validate_data_record_link() from public, anon, authenticated;

create trigger data_record_links_validate before insert or update on public.data_record_links
for each row execute function private.validate_data_record_link();

create trigger data_tables_set_updated_at before update on public.data_tables
for each row execute function private.set_updated_at();
create trigger data_fields_set_updated_at before update on public.data_fields
for each row execute function private.set_updated_at();
create trigger data_records_set_updated_at before update on public.data_records
for each row execute function private.set_updated_at();
create trigger data_cells_set_updated_at before update on public.data_cells
for each row execute function private.set_updated_at();
create trigger data_views_set_updated_at before update on public.data_views
for each row execute function private.set_updated_at();
create trigger data_forms_set_updated_at before update on public.data_forms
for each row execute function private.set_updated_at();
create trigger data_interfaces_set_updated_at before update on public.data_interfaces
for each row execute function private.set_updated_at();

alter table public.data_tables enable row level security;
alter table public.data_fields enable row level security;
alter table public.data_records enable row level security;
alter table public.data_cells enable row level security;
alter table public.data_record_links enable row level security;
alter table public.data_views enable row level security;
alter table public.data_forms enable row level security;
alter table public.data_form_fields enable row level security;
alter table public.data_interfaces enable row level security;
alter table public.data_interface_blocks enable row level security;

alter table public.data_tables force row level security;
alter table public.data_fields force row level security;
alter table public.data_records force row level security;
alter table public.data_cells force row level security;
alter table public.data_record_links force row level security;
alter table public.data_views force row level security;
alter table public.data_forms force row level security;
alter table public.data_form_fields force row level security;
alter table public.data_interfaces force row level security;
alter table public.data_interface_blocks force row level security;

create policy data_tables_read_member on public.data_tables for select to authenticated
using (private.has_project_role(project_id, array['owner', 'editor', 'read_only']));
create policy data_fields_read_member on public.data_fields for select to authenticated
using (private.has_project_role(project_id, array['owner', 'editor', 'read_only']));
create policy data_records_read_member on public.data_records for select to authenticated
using (private.has_project_role(project_id, array['owner', 'editor', 'read_only']));
create policy data_cells_read_member on public.data_cells for select to authenticated
using (private.has_project_role(project_id, array['owner', 'editor', 'read_only']));
create policy data_record_links_read_member on public.data_record_links for select to authenticated
using (private.has_project_role(project_id, array['owner', 'editor', 'read_only']));
create policy data_views_read_member on public.data_views for select to authenticated
using (private.has_project_role(project_id, array['owner', 'editor', 'read_only']));
create policy data_forms_read_member on public.data_forms for select to authenticated
using (private.has_project_role(project_id, array['owner', 'editor', 'read_only']));
create policy data_form_fields_read_member on public.data_form_fields for select to authenticated
using (exists (
  select 1 from public.data_forms as form
  where form.id = form_id
    and private.has_project_role(form.project_id, array['owner', 'editor', 'read_only'])
));
create policy data_interfaces_read_member on public.data_interfaces for select to authenticated
using (private.has_project_role(project_id, array['owner', 'editor', 'read_only']));
create policy data_interface_blocks_read_member on public.data_interface_blocks for select to authenticated
using (exists (
  select 1 from public.data_interfaces as interface
  where interface.id = interface_id
    and private.has_project_role(interface.project_id, array['owner', 'editor', 'read_only'])
));

revoke all on public.data_tables, public.data_fields, public.data_records, public.data_cells,
  public.data_record_links, public.data_views, public.data_forms, public.data_form_fields,
  public.data_interfaces, public.data_interface_blocks from anon, authenticated;
grant select on public.data_tables, public.data_fields, public.data_records, public.data_cells,
  public.data_record_links, public.data_views, public.data_forms, public.data_form_fields,
  public.data_interfaces, public.data_interface_blocks to authenticated;

create function public.create_data_table(
  p_project_id uuid,
  p_name text,
  p_idempotency_key uuid,
  p_description text default null,
  p_color text default 'blue'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_project_editor(p_project_id);
  v_id uuid := gen_random_uuid();
  v_primary_id uuid := gen_random_uuid();
  v_hash text;
  v_replay boolean;
  v_existing_id uuid;
  v_position integer;
begin
  if length(btrim(coalesce(p_name, ''))) not between 1 and 120 then
    raise exception using errcode = '22023', message = 'Table name must be between 1 and 120 characters.';
  end if;
  if p_color not in ('blue', 'cyan', 'green', 'amber', 'orange', 'violet', 'rose', 'slate') then
    raise exception using errcode = '22023', message = 'Choose a supported table color.';
  end if;

  v_hash := encode(extensions.digest(convert_to(jsonb_build_object(
    'project_id', p_project_id, 'name', btrim(p_name),
    'description', nullif(btrim(coalesce(p_description, '')), ''), 'color', p_color
  )::text, 'UTF8'), 'sha256'), 'hex');
  select replay, existing_result_id into v_replay, v_existing_id
  from private.begin_idempotent_command(p_project_id, 'data_table.create', p_idempotency_key, v_hash);
  if v_replay then return v_existing_id; end if;

  select coalesce(max(position), -1) + 1 into v_position
  from public.data_tables where project_id = p_project_id and archived_at is null;

  insert into public.data_tables(id, project_id, name, description, color, position, created_by)
  values (v_id, p_project_id, btrim(p_name), nullif(btrim(coalesce(p_description, '')), ''), p_color, v_position, v_actor);
  insert into public.data_fields(id, project_id, table_id, name, field_type, position, is_primary, is_required, created_by)
  values (v_primary_id, p_project_id, v_id, 'Name', 'text', 0, true, true, v_actor);
  insert into public.data_views(project_id, table_id, name, view_type, position, created_by)
  values (p_project_id, v_id, 'Grid view', 'grid', 0, v_actor);

  insert into public.audit_events(project_id, actor_user_id, action, entity_type, entity_id, request_id, after_state)
  values (p_project_id, v_actor, 'data_table.created', 'data_table', v_id, p_idempotency_key,
    jsonb_build_object('name', btrim(p_name), 'primary_field_id', v_primary_id));
  perform private.complete_idempotent_command('data_table.create', p_idempotency_key, v_id);
  return v_id;
end;
$$;

create function public.create_data_field(
  p_project_id uuid,
  p_table_id uuid,
  p_name text,
  p_field_type text,
  p_idempotency_key uuid,
  p_is_required boolean default false,
  p_config jsonb default '{}'::jsonb,
  p_linked_table_id uuid default null,
  p_lookup_link_field_id uuid default null,
  p_lookup_target_field_id uuid default null
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
  v_position integer;
  v_link public.data_fields%rowtype;
  v_target public.data_fields%rowtype;
  v_source_count integer;
begin
  perform 1 from public.data_tables
  where id = p_table_id and project_id = p_project_id and archived_at is null;
  if not found then raise exception using errcode = '22023', message = 'Active table was not found.'; end if;
  if length(btrim(coalesce(p_name, ''))) not between 1 and 120 then
    raise exception using errcode = '22023', message = 'Field name must be between 1 and 120 characters.';
  end if;
  if p_field_type not in ('text', 'long_text', 'number', 'currency', 'date', 'checkbox',
    'single_select', 'multi_select', 'email', 'phone', 'url', 'link', 'lookup', 'formula') then
    raise exception using errcode = '22023', message = 'Unsupported field type.';
  end if;
  if jsonb_typeof(coalesce(p_config, '{}'::jsonb)) <> 'object' then
    raise exception using errcode = '22023', message = 'Field configuration must be an object.';
  end if;

  if p_field_type = 'link' then
    perform 1 from public.data_tables where id = p_linked_table_id and project_id = p_project_id and archived_at is null;
    if not found then raise exception using errcode = '22023', message = 'Linked table was not found.'; end if;
  elsif p_linked_table_id is not null then
    raise exception using errcode = '22023', message = 'Only linked-record fields can select a linked table.';
  end if;

  if p_field_type = 'lookup' then
    select * into v_link from public.data_fields
    where id = p_lookup_link_field_id and table_id = p_table_id and project_id = p_project_id
      and field_type = 'link' and archived_at is null;
    select * into v_target from public.data_fields
    where id = p_lookup_target_field_id and project_id = p_project_id and archived_at is null;
    if v_link.id is null or v_target.id is null or v_target.table_id <> v_link.linked_table_id
       or v_target.field_type in ('lookup', 'formula') then
      raise exception using errcode = '22023', message = 'Lookup fields must follow a link to a stored field in the linked table.';
    end if;
  elsif p_lookup_link_field_id is not null or p_lookup_target_field_id is not null then
    raise exception using errcode = '22023', message = 'Lookup sources are only valid for lookup fields.';
  end if;

  if p_field_type = 'formula' then
    if coalesce(p_config ->> 'operator', '') not in ('sum', 'difference', 'multiply', 'percent', 'concatenate', 'count')
       or jsonb_typeof(p_config -> 'sourceFieldIds') <> 'array'
       or jsonb_array_length(p_config -> 'sourceFieldIds') = 0 then
      raise exception using errcode = '22023', message = 'Formula requires an operator and at least one source field.';
    end if;
    select count(*) into v_source_count
    from jsonb_array_elements_text(p_config -> 'sourceFieldIds') as source(value)
    join public.data_fields as field on field.id = source.value::uuid
      and field.table_id = p_table_id and field.project_id = p_project_id
      and field.archived_at is null and field.field_type not in ('lookup', 'formula');
    if v_source_count <> jsonb_array_length(p_config -> 'sourceFieldIds') then
      raise exception using errcode = '22023', message = 'Every formula source must be a stored field in this table.';
    end if;
  end if;

  v_hash := encode(extensions.digest(convert_to(jsonb_build_object(
    'project_id', p_project_id, 'table_id', p_table_id, 'name', btrim(p_name),
    'field_type', p_field_type, 'required', p_is_required, 'config', coalesce(p_config, '{}'::jsonb),
    'linked_table_id', p_linked_table_id, 'lookup_link_field_id', p_lookup_link_field_id,
    'lookup_target_field_id', p_lookup_target_field_id
  )::text, 'UTF8'), 'sha256'), 'hex');
  select replay, existing_result_id into v_replay, v_existing_id
  from private.begin_idempotent_command(p_project_id, 'data_field.create', p_idempotency_key, v_hash);
  if v_replay then return v_existing_id; end if;

  select coalesce(max(position), -1) + 1 into v_position
  from public.data_fields where table_id = p_table_id and archived_at is null;
  insert into public.data_fields(
    id, project_id, table_id, name, field_type, position, is_required, config,
    linked_table_id, lookup_link_field_id, lookup_target_field_id, created_by
  ) values (
    v_id, p_project_id, p_table_id, btrim(p_name), p_field_type, v_position,
    p_is_required, coalesce(p_config, '{}'::jsonb), p_linked_table_id,
    p_lookup_link_field_id, p_lookup_target_field_id, v_actor
  );
  insert into public.audit_events(project_id, actor_user_id, action, entity_type, entity_id, request_id, after_state)
  values (p_project_id, v_actor, 'data_field.created', 'data_field', v_id, p_idempotency_key,
    jsonb_build_object('table_id', p_table_id, 'name', btrim(p_name), 'field_type', p_field_type));
  perform private.complete_idempotent_command('data_field.create', p_idempotency_key, v_id);
  return v_id;
end;
$$;

create function private.write_data_record_values(
  p_project_id uuid,
  p_table_id uuid,
  p_record_id uuid,
  p_actor uuid,
  p_values jsonb,
  p_links jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item record;
  v_field public.data_fields%rowtype;
  v_text text;
  v_target text;
  v_position integer;
begin
  if jsonb_typeof(coalesce(p_values, '{}'::jsonb)) <> 'object'
     or jsonb_typeof(coalesce(p_links, '{}'::jsonb)) <> 'object' then
    raise exception using errcode = '22023', message = 'Record values and links must be objects.';
  end if;

  delete from public.data_cells where record_id = p_record_id;
  delete from public.data_record_links where source_record_id = p_record_id;

  for v_item in select key, value from jsonb_each(coalesce(p_values, '{}'::jsonb)) loop
    begin
      select * into strict v_field from public.data_fields
      where id = v_item.key::uuid and table_id = p_table_id and project_id = p_project_id and archived_at is null;
    exception when no_data_found or invalid_text_representation then
      raise exception using errcode = '22023', message = 'Record contains an unknown field.';
    end;
    if v_field.field_type in ('link', 'lookup', 'formula') then
      raise exception using errcode = '22023', message = 'Computed and linked values must use their configured relationship.';
    end if;
    if v_item.value = 'null'::jsonb then continue; end if;
    v_text := nullif(btrim(v_item.value #>> '{}'), '');
    if v_text is null and v_field.field_type <> 'checkbox' then continue; end if;

    if v_field.field_type in ('text', 'long_text', 'email', 'phone', 'url') then
      insert into public.data_cells(project_id, table_id, record_id, field_id, text_value, created_by, updated_by)
      values (p_project_id, p_table_id, p_record_id, v_field.id, v_text, p_actor, p_actor);
    elsif v_field.field_type in ('number', 'currency') then
      insert into public.data_cells(project_id, table_id, record_id, field_id, number_value, created_by, updated_by)
      values (p_project_id, p_table_id, p_record_id, v_field.id, v_text::numeric, p_actor, p_actor);
    elsif v_field.field_type = 'checkbox' then
      insert into public.data_cells(project_id, table_id, record_id, field_id, boolean_value, created_by, updated_by)
      values (p_project_id, p_table_id, p_record_id, v_field.id, coalesce(v_text::boolean, false), p_actor, p_actor);
    elsif v_field.field_type = 'date' then
      insert into public.data_cells(project_id, table_id, record_id, field_id, date_value, created_by, updated_by)
      values (p_project_id, p_table_id, p_record_id, v_field.id, v_text::date, p_actor, p_actor);
    elsif v_field.field_type = 'single_select' then
      if not coalesce(v_field.config -> 'options', '[]'::jsonb) ? v_text then
        raise exception using errcode = '22023', message = 'Select value is not one of the configured options.';
      end if;
      insert into public.data_cells(project_id, table_id, record_id, field_id, option_value, created_by, updated_by)
      values (p_project_id, p_table_id, p_record_id, v_field.id, v_text, p_actor, p_actor);
    elsif v_field.field_type = 'multi_select' then
      if jsonb_typeof(v_item.value) <> 'array' then
        raise exception using errcode = '22023', message = 'Multi-select values must be an array.';
      end if;
      if exists (
        select 1 from jsonb_array_elements_text(v_item.value) as selected(value)
        where not coalesce(v_field.config -> 'options', '[]'::jsonb) ? selected.value
      ) then
        raise exception using errcode = '22023', message = 'Multi-select contains an unsupported option.';
      end if;
      insert into public.data_cells(project_id, table_id, record_id, field_id, json_value, created_by, updated_by)
      values (p_project_id, p_table_id, p_record_id, v_field.id, v_item.value, p_actor, p_actor);
    end if;
  end loop;

  for v_item in select key, value from jsonb_each(coalesce(p_links, '{}'::jsonb)) loop
    begin
      select * into strict v_field from public.data_fields
      where id = v_item.key::uuid and table_id = p_table_id and project_id = p_project_id
        and field_type = 'link' and archived_at is null;
    exception when no_data_found or invalid_text_representation then
      raise exception using errcode = '22023', message = 'Record contains an unknown linked-record field.';
    end;
    if jsonb_typeof(v_item.value) <> 'array' then
      raise exception using errcode = '22023', message = 'Linked-record values must be an array.';
    end if;
    v_position := 0;
    for v_target in select value from jsonb_array_elements_text(v_item.value) loop
      insert into public.data_record_links(project_id, field_id, source_record_id, target_record_id, position, created_by)
      values (p_project_id, v_field.id, p_record_id, v_target::uuid, v_position, p_actor);
      v_position := v_position + 1;
    end loop;
  end loop;

  if exists (
    select 1 from public.data_fields as field
    where field.table_id = p_table_id and field.project_id = p_project_id
      and field.archived_at is null and field.is_required
      and (
        (field.field_type = 'link' and not exists (
          select 1 from public.data_record_links as link
          where link.source_record_id = p_record_id and link.field_id = field.id
        ))
        or (field.field_type not in ('link', 'lookup', 'formula') and not exists (
          select 1 from public.data_cells as cell
          where cell.record_id = p_record_id and cell.field_id = field.id
        ))
      )
  ) then
    raise exception using errcode = '23514', message = 'Every required field needs a value.';
  end if;
end;
$$;

revoke all on function private.write_data_record_values(uuid, uuid, uuid, uuid, jsonb, jsonb)
  from public, anon, authenticated;

create function public.save_data_record(
  p_project_id uuid,
  p_table_id uuid,
  p_values jsonb,
  p_links jsonb,
  p_idempotency_key uuid,
  p_record_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_project_editor(p_project_id);
  v_id uuid := coalesce(p_record_id, gen_random_uuid());
  v_hash text;
  v_scope text := case when p_record_id is null then 'data_record.create' else 'data_record.update' end;
  v_replay boolean;
  v_existing_id uuid;
begin
  perform 1 from public.data_tables
  where id = p_table_id and project_id = p_project_id and archived_at is null;
  if not found then raise exception using errcode = '22023', message = 'Active table was not found.'; end if;

  v_hash := encode(extensions.digest(convert_to(jsonb_build_object(
    'project_id', p_project_id, 'table_id', p_table_id, 'record_id', p_record_id,
    'values', coalesce(p_values, '{}'::jsonb), 'links', coalesce(p_links, '{}'::jsonb)
  )::text, 'UTF8'), 'sha256'), 'hex');
  select replay, existing_result_id into v_replay, v_existing_id
  from private.begin_idempotent_command(p_project_id, v_scope, p_idempotency_key, v_hash);
  if v_replay then return v_existing_id; end if;

  if p_record_id is null then
    insert into public.data_records(id, project_id, table_id, created_by, updated_by)
    values (v_id, p_project_id, p_table_id, v_actor, v_actor);
  else
    perform 1 from public.data_records
    where id = p_record_id and project_id = p_project_id and table_id = p_table_id and archived_at is null
    for update;
    if not found then raise exception using errcode = '22023', message = 'Active record was not found.'; end if;
    update public.data_records set updated_by = v_actor where id = p_record_id;
  end if;

  perform private.write_data_record_values(
    p_project_id, p_table_id, v_id, v_actor,
    coalesce(p_values, '{}'::jsonb), coalesce(p_links, '{}'::jsonb)
  );
  insert into public.audit_events(project_id, actor_user_id, action, entity_type, entity_id, request_id, after_state)
  values (p_project_id, v_actor,
    case when p_record_id is null then 'data_record.created' else 'data_record.updated' end,
    'data_record', v_id, p_idempotency_key,
    jsonb_build_object(
      'table_id', p_table_id,
      'field_count', (select count(*) from jsonb_object_keys(coalesce(p_values, '{}'::jsonb))),
      'link_field_count', (select count(*) from jsonb_object_keys(coalesce(p_links, '{}'::jsonb)))
    ));
  perform private.complete_idempotent_command(v_scope, p_idempotency_key, v_id);
  return v_id;
end;
$$;

create function public.archive_data_record(
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
  v_hash text;
  v_replay boolean;
  v_existing_id uuid;
begin
  v_hash := encode(extensions.digest(convert_to(jsonb_build_object(
    'project_id', p_project_id, 'record_id', p_record_id
  )::text, 'UTF8'), 'sha256'), 'hex');
  select replay, existing_result_id into v_replay, v_existing_id
  from private.begin_idempotent_command(p_project_id, 'data_record.archive', p_idempotency_key, v_hash);
  if v_replay then return v_existing_id; end if;
  if exists (
    select 1 from public.data_record_links as link
    join public.data_records as source on source.id = link.source_record_id and source.archived_at is null
    where link.target_record_id = p_record_id
  ) then
    raise exception using errcode = '23514', message = 'Unlink this record from active records before archiving it.';
  end if;
  delete from public.data_record_links where source_record_id = p_record_id;
  update public.data_records set archived_at = now(), updated_by = v_actor
  where id = p_record_id and project_id = p_project_id and archived_at is null;
  if not found then raise exception using errcode = '22023', message = 'Active record was not found.'; end if;
  insert into public.audit_events(project_id, actor_user_id, action, entity_type, entity_id, request_id)
  values (p_project_id, v_actor, 'data_record.archived', 'data_record', p_record_id, p_idempotency_key);
  perform private.complete_idempotent_command('data_record.archive', p_idempotency_key, p_record_id);
  return p_record_id;
end;
$$;

create function public.create_data_view(
  p_project_id uuid,
  p_table_id uuid,
  p_name text,
  p_view_type text,
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
  v_position integer;
begin
  perform 1 from public.data_tables where id = p_table_id and project_id = p_project_id and archived_at is null;
  if not found then raise exception using errcode = '22023', message = 'Active table was not found.'; end if;
  if length(btrim(coalesce(p_name, ''))) not between 1 and 120 or p_view_type not in ('grid', 'list', 'gallery') then
    raise exception using errcode = '22023', message = 'View name or type is invalid.';
  end if;
  v_hash := encode(extensions.digest(convert_to(jsonb_build_object(
    'project_id', p_project_id, 'table_id', p_table_id, 'name', btrim(p_name), 'type', p_view_type
  )::text, 'UTF8'), 'sha256'), 'hex');
  select replay, existing_result_id into v_replay, v_existing_id
  from private.begin_idempotent_command(p_project_id, 'data_view.create', p_idempotency_key, v_hash);
  if v_replay then return v_existing_id; end if;
  select coalesce(max(position), -1) + 1 into v_position from public.data_views
  where table_id = p_table_id and archived_at is null;
  insert into public.data_views(id, project_id, table_id, name, view_type, position, created_by)
  values (v_id, p_project_id, p_table_id, btrim(p_name), p_view_type, v_position, v_actor);
  insert into public.audit_events(project_id, actor_user_id, action, entity_type, entity_id, request_id, after_state)
  values (p_project_id, v_actor, 'data_view.created', 'data_view', v_id, p_idempotency_key,
    jsonb_build_object('table_id', p_table_id, 'name', btrim(p_name), 'view_type', p_view_type));
  perform private.complete_idempotent_command('data_view.create', p_idempotency_key, v_id);
  return v_id;
end;
$$;

create function public.create_data_form(
  p_project_id uuid,
  p_table_id uuid,
  p_name text,
  p_idempotency_key uuid,
  p_description text default null,
  p_submit_label text default 'Submit'
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
begin
  perform 1 from public.data_tables where id = p_table_id and project_id = p_project_id and archived_at is null;
  if not found then raise exception using errcode = '22023', message = 'Active table was not found.'; end if;
  if length(btrim(coalesce(p_name, ''))) not between 1 and 120
     or length(btrim(coalesce(p_submit_label, ''))) not between 1 and 80 then
    raise exception using errcode = '22023', message = 'Form name and submit label are required.';
  end if;
  v_hash := encode(extensions.digest(convert_to(jsonb_build_object(
    'project_id', p_project_id, 'table_id', p_table_id, 'name', btrim(p_name),
    'description', nullif(btrim(coalesce(p_description, '')), ''), 'submit_label', btrim(p_submit_label)
  )::text, 'UTF8'), 'sha256'), 'hex');
  select replay, existing_result_id into v_replay, v_existing_id
  from private.begin_idempotent_command(p_project_id, 'data_form.create', p_idempotency_key, v_hash);
  if v_replay then return v_existing_id; end if;
  insert into public.data_forms(id, project_id, table_id, name, description, submit_label, created_by)
  values (v_id, p_project_id, p_table_id, btrim(p_name), nullif(btrim(coalesce(p_description, '')), ''), btrim(p_submit_label), v_actor);
  insert into public.data_form_fields(form_id, field_id, position, is_required)
  select v_id, field.id, field.position, field.is_required
  from public.data_fields as field
  where field.table_id = p_table_id and field.archived_at is null and field.field_type not in ('lookup', 'formula')
  order by field.position;
  insert into public.audit_events(project_id, actor_user_id, action, entity_type, entity_id, request_id, after_state)
  values (p_project_id, v_actor, 'data_form.created', 'data_form', v_id, p_idempotency_key,
    jsonb_build_object('table_id', p_table_id, 'name', btrim(p_name)));
  perform private.complete_idempotent_command('data_form.create', p_idempotency_key, v_id);
  return v_id;
end;
$$;

create function public.create_data_interface(
  p_project_id uuid,
  p_name text,
  p_table_id uuid,
  p_idempotency_key uuid,
  p_description text default null
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
begin
  perform 1 from public.data_tables where id = p_table_id and project_id = p_project_id and archived_at is null;
  if not found then raise exception using errcode = '22023', message = 'Active table was not found.'; end if;
  if length(btrim(coalesce(p_name, ''))) not between 1 and 120 then
    raise exception using errcode = '22023', message = 'Interface name is required.';
  end if;
  v_hash := encode(extensions.digest(convert_to(jsonb_build_object(
    'project_id', p_project_id, 'table_id', p_table_id, 'name', btrim(p_name),
    'description', nullif(btrim(coalesce(p_description, '')), '')
  )::text, 'UTF8'), 'sha256'), 'hex');
  select replay, existing_result_id into v_replay, v_existing_id
  from private.begin_idempotent_command(p_project_id, 'data_interface.create', p_idempotency_key, v_hash);
  if v_replay then return v_existing_id; end if;
  insert into public.data_interfaces(id, project_id, name, description, created_by)
  values (v_id, p_project_id, btrim(p_name), nullif(btrim(coalesce(p_description, '')), ''), v_actor);
  insert into public.data_interface_blocks(interface_id, table_id, name, block_type, position)
  values
    (v_id, p_table_id, 'Total records', 'record_count', 0),
    (v_id, p_table_id, 'Recent records', 'record_list', 1);
  insert into public.audit_events(project_id, actor_user_id, action, entity_type, entity_id, request_id, after_state)
  values (p_project_id, v_actor, 'data_interface.created', 'data_interface', v_id, p_idempotency_key,
    jsonb_build_object('table_id', p_table_id, 'name', btrim(p_name)));
  perform private.complete_idempotent_command('data_interface.create', p_idempotency_key, v_id);
  return v_id;
end;
$$;

create function public.install_construction_workspace(
  p_project_id uuid,
  p_idempotency_key uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_project_editor(p_project_id);
  v_result_id uuid := gen_random_uuid();
  v_hash text;
  v_replay boolean;
  v_existing_id uuid;
  v_phases uuid := gen_random_uuid();
  v_tasks uuid := gen_random_uuid();
  v_suppliers uuid := gen_random_uuid();
  v_expenses uuid := gen_random_uuid();
  v_materials uuid := gen_random_uuid();
  v_workers uuid := gen_random_uuid();
  v_attendance uuid := gen_random_uuid();
  v_logs uuid := gen_random_uuid();
  v_phase_link uuid := gen_random_uuid();
  v_supplier_link uuid := gen_random_uuid();
  v_expense_amount uuid := gen_random_uuid();
  v_task_progress uuid := gen_random_uuid();
  v_interface uuid := gen_random_uuid();
  v_expense_form uuid := gen_random_uuid();
  v_log_form uuid := gen_random_uuid();
begin
  v_hash := encode(extensions.digest(convert_to(jsonb_build_object(
    'project_id', p_project_id, 'starter', 'construction-v1'
  )::text, 'UTF8'), 'sha256'), 'hex');
  select replay, existing_result_id into v_replay, v_existing_id
  from private.begin_idempotent_command(p_project_id, 'workspace.install_construction', p_idempotency_key, v_hash);
  if v_replay then return v_existing_id; end if;
  if exists (select 1 from public.data_tables where project_id = p_project_id and archived_at is null) then
    raise exception using errcode = '23505', message = 'Construction starter can only be installed into an empty data workspace.';
  end if;

  insert into public.data_tables(id, project_id, name, description, color, position, created_by) values
    (v_phases, p_project_id, 'Phases', 'Construction phases and major work packages.', 'blue', 0, v_actor),
    (v_tasks, p_project_id, 'Tasks', 'Planned work, status, dependencies, and progress.', 'cyan', 1, v_actor),
    (v_suppliers, p_project_id, 'Suppliers', 'Companies and people supplying the project.', 'violet', 2, v_actor),
    (v_expenses, p_project_id, 'Expenses', 'Direct project costs linked to suppliers and tasks.', 'amber', 3, v_actor),
    (v_materials, p_project_id, 'Materials', 'Material catalogue and reorder planning.', 'orange', 4, v_actor),
    (v_workers, p_project_id, 'Workers', 'Site workers and trades.', 'green', 5, v_actor),
    (v_attendance, p_project_id, 'Attendance', 'Daily worker attendance without wages or payroll.', 'slate', 6, v_actor),
    (v_logs, p_project_id, 'Daily Site Logs', 'Daily site notes, activity, and conditions.', 'rose', 7, v_actor);

  insert into public.data_fields(project_id, table_id, name, field_type, position, is_primary, is_required, config, linked_table_id, created_by) values
    (p_project_id, v_phases, 'Phase', 'text', 0, true, true, '{}', null, v_actor),
    (p_project_id, v_phases, 'Status', 'single_select', 1, false, false, '{"options":["Not started","In progress","Complete","On hold"]}', null, v_actor),
    (p_project_id, v_phases, 'Start date', 'date', 2, false, false, '{}', null, v_actor),
    (p_project_id, v_phases, 'End date', 'date', 3, false, false, '{}', null, v_actor),

    (p_project_id, v_tasks, 'Task', 'text', 0, true, true, '{}', null, v_actor),
    (p_project_id, v_tasks, 'Phase', 'link', 1, false, false, '{}', v_phases, v_actor),
    (p_project_id, v_tasks, 'Status', 'single_select', 2, false, false, '{"options":["Not started","In progress","Blocked","Complete"]}', null, v_actor),
    (p_project_id, v_tasks, 'Progress', 'number', 3, false, false, '{"suffix":"%","min":0,"max":100}', null, v_actor),
    (p_project_id, v_tasks, 'Due date', 'date', 4, false, false, '{}', null, v_actor),
    (p_project_id, v_tasks, 'Predecessors', 'link', 5, false, false, '{}', v_tasks, v_actor),
    (p_project_id, v_tasks, 'Notes', 'long_text', 6, false, false, '{}', null, v_actor),

    (p_project_id, v_suppliers, 'Supplier', 'text', 0, true, true, '{}', null, v_actor),
    (p_project_id, v_suppliers, 'Contact name', 'text', 1, false, false, '{}', null, v_actor),
    (p_project_id, v_suppliers, 'Phone', 'phone', 2, false, false, '{}', null, v_actor),
    (p_project_id, v_suppliers, 'Email', 'email', 3, false, false, '{}', null, v_actor),

    (p_project_id, v_expenses, 'Description', 'text', 0, true, true, '{}', null, v_actor),
    (p_project_id, v_expenses, 'Amount', 'currency', 1, false, true, '{"currency":"ZMW"}', null, v_actor),
    (p_project_id, v_expenses, 'Expense date', 'date', 2, false, true, '{}', null, v_actor),
    (p_project_id, v_expenses, 'Supplier', 'link', 3, false, false, '{}', v_suppliers, v_actor),
    (p_project_id, v_expenses, 'Related task', 'link', 4, false, false, '{}', v_tasks, v_actor),
    (p_project_id, v_expenses, 'Paid', 'checkbox', 5, false, false, '{}', null, v_actor),

    (p_project_id, v_materials, 'Material', 'text', 0, true, true, '{}', null, v_actor),
    (p_project_id, v_materials, 'Category', 'text', 1, false, false, '{}', null, v_actor),
    (p_project_id, v_materials, 'Unit', 'single_select', 2, false, false, '{"options":["bag","each","kg","m","m2","m3","litre","load"]}', null, v_actor),
    (p_project_id, v_materials, 'Reorder level', 'number', 3, false, false, '{}', null, v_actor),
    (p_project_id, v_materials, 'Notes', 'long_text', 4, false, false, '{}', null, v_actor),

    (p_project_id, v_workers, 'Worker', 'text', 0, true, true, '{}', null, v_actor),
    (p_project_id, v_workers, 'Trade', 'text', 1, false, false, '{}', null, v_actor),
    (p_project_id, v_workers, 'Phone', 'phone', 2, false, false, '{}', null, v_actor),
    (p_project_id, v_workers, 'Active', 'checkbox', 3, false, false, '{}', null, v_actor),

    (p_project_id, v_attendance, 'Entry', 'text', 0, true, true, '{}', null, v_actor),
    (p_project_id, v_attendance, 'Worker', 'link', 1, false, true, '{}', v_workers, v_actor),
    (p_project_id, v_attendance, 'Date', 'date', 2, false, true, '{}', null, v_actor),
    (p_project_id, v_attendance, 'Present', 'checkbox', 3, false, false, '{}', null, v_actor),
    (p_project_id, v_attendance, 'Hours', 'number', 4, false, false, '{}', null, v_actor),

    (p_project_id, v_logs, 'Log title', 'text', 0, true, true, '{}', null, v_actor),
    (p_project_id, v_logs, 'Date', 'date', 1, false, true, '{}', null, v_actor),
    (p_project_id, v_logs, 'Work completed', 'long_text', 2, false, true, '{}', null, v_actor),
    (p_project_id, v_logs, 'Workers present', 'number', 3, false, false, '{}', null, v_actor),
    (p_project_id, v_logs, 'Weather', 'text', 4, false, false, '{}', null, v_actor),
    (p_project_id, v_logs, 'Related tasks', 'link', 5, false, false, '{}', v_tasks, v_actor);

  select id into v_phase_link from public.data_fields where table_id = v_tasks and name = 'Phase';
  select id into v_supplier_link from public.data_fields where table_id = v_expenses and name = 'Supplier';
  select id into v_expense_amount from public.data_fields where table_id = v_expenses and name = 'Amount';
  select id into v_task_progress from public.data_fields where table_id = v_tasks and name = 'Progress';

  insert into public.data_fields(project_id, table_id, name, field_type, position, lookup_link_field_id, lookup_target_field_id, created_by)
  select p_project_id, v_tasks, 'Phase status', 'lookup', 7, v_phase_link, field.id, v_actor
  from public.data_fields as field where field.table_id = v_phases and field.name = 'Status';
  insert into public.data_fields(project_id, table_id, name, field_type, position, lookup_link_field_id, lookup_target_field_id, created_by)
  select p_project_id, v_expenses, 'Supplier phone', 'lookup', 6, v_supplier_link, field.id, v_actor
  from public.data_fields as field where field.table_id = v_suppliers and field.name = 'Phone';

  insert into public.data_views(project_id, table_id, name, view_type, position, created_by)
  select p_project_id, table_data.id, 'Grid view', 'grid', 0, v_actor
  from public.data_tables as table_data where table_data.project_id = p_project_id;
  insert into public.data_views(project_id, table_id, name, view_type, position, created_by)
  values
    (p_project_id, v_tasks, 'Task list', 'list', 1, v_actor),
    (p_project_id, v_materials, 'Material gallery', 'gallery', 1, v_actor);

  insert into public.data_forms(id, project_id, table_id, name, description, submit_label, created_by) values
    (v_expense_form, p_project_id, v_expenses, 'Expense entry', 'Capture a project expense from a phone or computer.', 'Add expense', v_actor),
    (v_log_form, p_project_id, v_logs, 'Daily site log', 'Record today''s work, people, and conditions.', 'Save site log', v_actor);
  insert into public.data_form_fields(form_id, field_id, position, is_required)
  select v_expense_form, field.id, field.position, field.is_required from public.data_fields as field
  where field.table_id = v_expenses and field.field_type not in ('lookup', 'formula');
  insert into public.data_form_fields(form_id, field_id, position, is_required)
  select v_log_form, field.id, field.position, field.is_required from public.data_fields as field
  where field.table_id = v_logs and field.field_type not in ('lookup', 'formula');

  insert into public.data_interfaces(id, project_id, name, description, created_by)
  values (v_interface, p_project_id, 'Construction overview', 'A live interface assembled from the configurable construction tables.', v_actor);
  insert into public.data_interface_blocks(interface_id, table_id, field_id, name, block_type, position, config) values
    (v_interface, v_tasks, null, 'Total tasks', 'record_count', 0, '{}'),
    (v_interface, v_tasks, v_task_progress, 'Average task progress', 'number_summary', 1, '{"operation":"average","suffix":"%"}'),
    (v_interface, v_expenses, v_expense_amount, 'Total expenses', 'number_summary', 2, '{"operation":"sum","currency":"ZMW"}'),
    (v_interface, v_tasks, null, 'Recent tasks', 'record_list', 3, '{"limit":6}'),
    (v_interface, v_logs, null, 'Recent site logs', 'record_list', 4, '{"limit":4}');

  insert into public.audit_events(project_id, actor_user_id, action, entity_type, entity_id, request_id, after_state)
  values (p_project_id, v_actor, 'workspace.construction_installed', 'data_workspace', v_result_id, p_idempotency_key,
    jsonb_build_object('version', 'construction-v1', 'table_count', 8, 'interface_id', v_interface));
  perform private.complete_idempotent_command('workspace.install_construction', p_idempotency_key, v_result_id);
  return v_result_id;
end;
$$;

revoke all on function public.create_data_table(uuid, text, uuid, text, text) from public, anon;
revoke all on function public.create_data_field(uuid, uuid, text, text, uuid, boolean, jsonb, uuid, uuid, uuid) from public, anon;
revoke all on function public.save_data_record(uuid, uuid, jsonb, jsonb, uuid, uuid) from public, anon;
revoke all on function public.archive_data_record(uuid, uuid, uuid) from public, anon;
revoke all on function public.create_data_view(uuid, uuid, text, text, uuid) from public, anon;
revoke all on function public.create_data_form(uuid, uuid, text, uuid, text, text) from public, anon;
revoke all on function public.create_data_interface(uuid, text, uuid, uuid, text) from public, anon;
revoke all on function public.install_construction_workspace(uuid, uuid) from public, anon;

grant execute on function public.create_data_table(uuid, text, uuid, text, text) to authenticated;
grant execute on function public.create_data_field(uuid, uuid, text, text, uuid, boolean, jsonb, uuid, uuid, uuid) to authenticated;
grant execute on function public.save_data_record(uuid, uuid, jsonb, jsonb, uuid, uuid) to authenticated;
grant execute on function public.archive_data_record(uuid, uuid, uuid) to authenticated;
grant execute on function public.create_data_view(uuid, uuid, text, text, uuid) to authenticated;
grant execute on function public.create_data_form(uuid, uuid, text, uuid, text, text) to authenticated;
grant execute on function public.create_data_interface(uuid, text, uuid, uuid, text) to authenticated;
grant execute on function public.install_construction_workspace(uuid, uuid) to authenticated;

comment on table public.data_tables is 'Configurable tables in the project workspace builder.';
comment on table public.data_record_links is 'Validated linked-record relationships between configurable tables.';
comment on function public.save_data_record(uuid, uuid, jsonb, jsonb, uuid, uuid) is
  'Creates or replaces one configurable record through a validated, authorized, idempotent command.';
