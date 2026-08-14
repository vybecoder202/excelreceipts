-- Project delivery foundation: phases, tasks, dependencies, milestones,
-- progress history, deterministic progress, RLS, and safe create commands.

create function private.next_project_number(
  p_project_id uuid,
  p_entity_key text,
  p_prefix text,
  p_year smallint default extract(year from current_date)::smallint
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_value bigint;
begin
  insert into public.number_sequences(project_id, entity_key, year, prefix, current_value)
  values (p_project_id, p_entity_key, p_year, p_prefix, 1)
  on conflict (project_id, entity_key, year) do update
    set current_value = public.number_sequences.current_value + 1,
        updated_at = now()
  returning current_value into v_value;

  return p_prefix || '-' || p_year::text || '-' || lpad(v_value::text, 4, '0');
end;
$$;

revoke all on function private.next_project_number(uuid, text, text, smallint)
  from public, anon, authenticated;

create table public.phases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  reference text not null,
  name text not null,
  description text,
  status text not null default 'planned',
  sort_order integer not null,
  planned_start date,
  planned_end date,
  actual_start date,
  actual_end date,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (project_id, id),
  unique (project_id, reference),
  unique (project_id, sort_order),
  constraint phase_name_not_blank check (length(btrim(name)) between 1 and 160),
  constraint phase_description_length check (description is null or length(description) <= 4000),
  constraint phase_status check (status in ('planned', 'in_progress', 'on_hold', 'completed', 'cancelled')),
  constraint phase_sort_order_positive check (sort_order > 0),
  constraint phase_planned_dates check (planned_start is null or planned_end is null or planned_end >= planned_start),
  constraint phase_actual_dates check (actual_start is null or actual_end is null or actual_end >= actual_start),
  constraint phase_completion_consistency check (
    (status = 'completed' and actual_end is not null) or status <> 'completed'
  )
);

create index phases_project_status_idx on public.phases(project_id, status, sort_order)
  where archived_at is null;

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  phase_id uuid,
  parent_task_id uuid,
  reference text not null,
  title text not null,
  description text,
  status text not null default 'not_started',
  priority text not null default 'normal',
  sort_order integer not null,
  planned_start date,
  planned_end date,
  completed_at timestamptz,
  percent_complete numeric(5,2) not null default 0,
  progress_weight numeric(12,4) not null default 1,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (project_id, id),
  unique (project_id, reference),
  foreign key (project_id, phase_id) references public.phases(project_id, id),
  foreign key (project_id, parent_task_id) references public.tasks(project_id, id),
  constraint task_title_not_blank check (length(btrim(title)) between 1 and 240),
  constraint task_description_length check (description is null or length(description) <= 8000),
  constraint task_status check (status in ('not_started', 'in_progress', 'blocked', 'completed', 'cancelled')),
  constraint task_priority check (priority in ('low', 'normal', 'high', 'critical')),
  constraint task_sort_order_positive check (sort_order > 0),
  constraint task_planned_dates check (planned_start is null or planned_end is null or planned_end >= planned_start),
  constraint task_percent_complete check (percent_complete between 0 and 100),
  constraint task_progress_weight check (progress_weight > 0 and progress_weight <= 1000000),
  constraint task_not_own_parent check (parent_task_id is null or parent_task_id <> id),
  constraint task_completion_consistency check (
    (status = 'completed' and percent_complete = 100 and completed_at is not null) or
    (status <> 'completed' and completed_at is null)
  )
);

create index tasks_project_phase_status_idx
  on public.tasks(project_id, phase_id, status, sort_order)
  where archived_at is null;
create index tasks_project_due_idx
  on public.tasks(project_id, planned_end)
  where archived_at is null and status not in ('completed', 'cancelled');

create table public.task_dependencies (
  project_id uuid not null references public.projects(id) on delete cascade,
  task_id uuid not null,
  depends_on_task_id uuid not null,
  dependency_type text not null default 'finish_to_start',
  lag_days integer not null default 0,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (project_id, task_id, depends_on_task_id),
  foreign key (project_id, task_id) references public.tasks(project_id, id) on delete cascade,
  foreign key (project_id, depends_on_task_id) references public.tasks(project_id, id) on delete cascade,
  constraint task_dependency_distinct check (task_id <> depends_on_task_id),
  constraint task_dependency_type check (
    dependency_type in ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish')
  ),
  constraint task_dependency_lag check (lag_days between -365 and 365)
);

create index task_dependencies_predecessor_idx
  on public.task_dependencies(project_id, depends_on_task_id);

create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  phase_id uuid,
  task_id uuid,
  reference text not null,
  title text not null,
  description text,
  due_date date not null,
  status text not null default 'upcoming',
  completed_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (project_id, id),
  unique (project_id, reference),
  foreign key (project_id, phase_id) references public.phases(project_id, id),
  foreign key (project_id, task_id) references public.tasks(project_id, id),
  constraint milestone_title_not_blank check (length(btrim(title)) between 1 and 240),
  constraint milestone_description_length check (description is null or length(description) <= 4000),
  constraint milestone_status check (status in ('upcoming', 'at_risk', 'achieved', 'missed', 'cancelled')),
  constraint milestone_completion_consistency check (
    (status = 'achieved' and completed_at is not null) or
    (status <> 'achieved' and completed_at is null)
  )
);

create index milestones_project_due_idx
  on public.milestones(project_id, due_date, status)
  where archived_at is null;

create table public.progress_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  phase_id uuid,
  task_id uuid,
  update_date date not null default current_date,
  summary text not null,
  overall_percent numeric(5,2),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  foreign key (project_id, phase_id) references public.phases(project_id, id),
  foreign key (project_id, task_id) references public.tasks(project_id, id),
  constraint progress_summary_not_blank check (length(btrim(summary)) between 1 and 8000),
  constraint progress_percent check (overall_percent is null or overall_percent between 0 and 100)
);

create index progress_updates_project_date_idx
  on public.progress_updates(project_id, update_date desc, created_at desc);

create trigger phases_set_updated_at
before update on public.phases
for each row execute function private.set_updated_at();

create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function private.set_updated_at();

create trigger milestones_set_updated_at
before update on public.milestones
for each row execute function private.set_updated_at();

alter table public.phases enable row level security;
alter table public.tasks enable row level security;
alter table public.task_dependencies enable row level security;
alter table public.milestones enable row level security;
alter table public.progress_updates enable row level security;

alter table public.phases force row level security;
alter table public.tasks force row level security;
alter table public.task_dependencies force row level security;
alter table public.milestones force row level security;
alter table public.progress_updates force row level security;

create policy phases_read_member on public.phases for select to authenticated
using (private.has_project_role(project_id, array['owner', 'editor', 'read_only']));

create policy tasks_read_member on public.tasks for select to authenticated
using (private.has_project_role(project_id, array['owner', 'editor', 'read_only']));

create policy task_dependencies_read_member on public.task_dependencies for select to authenticated
using (private.has_project_role(project_id, array['owner', 'editor', 'read_only']));

create policy milestones_read_member on public.milestones for select to authenticated
using (private.has_project_role(project_id, array['owner', 'editor', 'read_only']));

create policy progress_updates_read_member on public.progress_updates for select to authenticated
using (private.has_project_role(project_id, array['owner', 'editor', 'read_only']));

revoke all on public.phases, public.tasks, public.task_dependencies,
  public.milestones, public.progress_updates from anon, authenticated;
grant select on public.phases, public.tasks, public.task_dependencies,
  public.milestones, public.progress_updates to authenticated;

create view public.project_progress_summary
with (security_invoker = true)
as
select
  project.id as project_id,
  coalesce(
    round(
      sum(task.percent_complete * task.progress_weight)
        filter (where task.status <> 'cancelled' and task.archived_at is null) /
      nullif(
        sum(task.progress_weight)
          filter (where task.status <> 'cancelled' and task.archived_at is null),
        0
      ),
      2
    ),
    0
  )::numeric(5,2) as percent_complete,
  count(task.id) filter (
    where task.status not in ('completed', 'cancelled')
      and task.planned_end < current_date
      and task.archived_at is null
  )::bigint as overdue_task_count,
  count(task.id) filter (
    where task.status not in ('completed', 'cancelled')
      and task.archived_at is null
  )::bigint as open_task_count
from public.projects as project
left join public.tasks as task on task.project_id = project.id
group by project.id;

revoke all on public.project_progress_summary from anon, authenticated;
grant select on public.project_progress_summary to authenticated;

create function public.create_phase(
  p_project_id uuid,
  p_name text,
  p_idempotency_key uuid,
  p_description text default null,
  p_planned_start date default null,
  p_planned_end date default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_phase_id uuid := gen_random_uuid();
  v_request_hash text;
  v_existing public.idempotency_keys%rowtype;
  v_sort_order integer;
  v_reference text;
begin
  if v_actor is null or not private.has_project_role(p_project_id, array['owner', 'editor']) then
    raise exception using errcode = '42501', message = 'Project owner or editor access is required.';
  end if;

  if length(btrim(coalesce(p_name, ''))) = 0 then
    raise exception using errcode = '22023', message = 'Phase name is required.';
  end if;

  if p_planned_start is not null and p_planned_end is not null and p_planned_end < p_planned_start then
    raise exception using errcode = '22023', message = 'Phase planned end cannot be before its start.';
  end if;

  v_request_hash := encode(
    extensions.digest(
      convert_to(jsonb_build_object(
        'project_id', p_project_id,
        'name', btrim(p_name),
        'description', nullif(btrim(coalesce(p_description, '')), ''),
        'planned_start', p_planned_start,
        'planned_end', p_planned_end
      )::text, 'UTF8'),
      'sha256'
    ),
    'hex'
  );

  insert into public.idempotency_keys(
    project_id, actor_user_id, scope, idempotency_key, request_hash
  ) values (
    p_project_id, v_actor, 'phase.create', p_idempotency_key, v_request_hash
  )
  on conflict (actor_user_id, scope, idempotency_key) do nothing;

  if not found then
    select * into v_existing
    from public.idempotency_keys
    where actor_user_id = v_actor
      and scope = 'phase.create'
      and idempotency_key = p_idempotency_key;

    if v_existing.request_hash <> v_request_hash then
      raise exception using errcode = '22023', message = 'Idempotency key was reused with different phase input.';
    end if;

    if v_existing.status = 'completed' then
      return (v_existing.response_data ->> 'phase_id')::uuid;
    end if;

    raise exception using errcode = '55000', message = 'A phase request with this idempotency key is already processing.';
  end if;

  perform 1 from public.projects where id = p_project_id for update;
  if not found then
    raise exception using errcode = '22023', message = 'Project does not exist.';
  end if;

  select coalesce(max(sort_order), 0) + 1 into v_sort_order
  from public.phases where project_id = p_project_id;
  v_reference := private.next_project_number(p_project_id, 'phase', 'PH');

  insert into public.phases(
    id, project_id, reference, name, description, sort_order,
    planned_start, planned_end, created_by
  ) values (
    v_phase_id, p_project_id, v_reference, btrim(p_name),
    nullif(btrim(coalesce(p_description, '')), ''), v_sort_order,
    p_planned_start, p_planned_end, v_actor
  );

  insert into public.audit_events(
    project_id, actor_user_id, action, entity_type, entity_id,
    request_id, after_state
  ) values (
    p_project_id, v_actor, 'phase.created', 'phase', v_phase_id,
    p_idempotency_key,
    jsonb_build_object('reference', v_reference, 'name', btrim(p_name), 'status', 'planned')
  );

  update public.idempotency_keys
  set status = 'completed',
      response_data = jsonb_build_object('phase_id', v_phase_id),
      completed_at = now()
  where actor_user_id = v_actor
    and scope = 'phase.create'
    and idempotency_key = p_idempotency_key;

  return v_phase_id;
end;
$$;

revoke all on function public.create_phase(uuid, text, uuid, text, date, date)
  from public, anon;
grant execute on function public.create_phase(uuid, text, uuid, text, date, date)
  to authenticated;

create function public.create_task(
  p_project_id uuid,
  p_title text,
  p_idempotency_key uuid,
  p_phase_id uuid default null,
  p_description text default null,
  p_planned_start date default null,
  p_planned_end date default null,
  p_priority text default 'normal',
  p_progress_weight numeric default 1
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_task_id uuid := gen_random_uuid();
  v_request_hash text;
  v_existing public.idempotency_keys%rowtype;
  v_sort_order integer;
  v_reference text;
begin
  if v_actor is null or not private.has_project_role(p_project_id, array['owner', 'editor']) then
    raise exception using errcode = '42501', message = 'Project owner or editor access is required.';
  end if;

  if length(btrim(coalesce(p_title, ''))) = 0 then
    raise exception using errcode = '22023', message = 'Task title is required.';
  end if;

  if p_priority not in ('low', 'normal', 'high', 'critical') then
    raise exception using errcode = '22023', message = 'Task priority is invalid.';
  end if;

  if p_progress_weight <= 0 or p_progress_weight > 1000000 then
    raise exception using errcode = '22023', message = 'Task progress weight is invalid.';
  end if;

  if p_planned_start is not null and p_planned_end is not null and p_planned_end < p_planned_start then
    raise exception using errcode = '22023', message = 'Task planned end cannot be before its start.';
  end if;

  if p_phase_id is not null and not exists (
    select 1 from public.phases where id = p_phase_id and project_id = p_project_id
  ) then
    raise exception using errcode = '22023', message = 'Task phase does not belong to the project.';
  end if;

  v_request_hash := encode(
    extensions.digest(
      convert_to(jsonb_build_object(
        'project_id', p_project_id,
        'phase_id', p_phase_id,
        'title', btrim(p_title),
        'description', nullif(btrim(coalesce(p_description, '')), ''),
        'planned_start', p_planned_start,
        'planned_end', p_planned_end,
        'priority', p_priority,
        'progress_weight', p_progress_weight
      )::text, 'UTF8'),
      'sha256'
    ),
    'hex'
  );

  insert into public.idempotency_keys(
    project_id, actor_user_id, scope, idempotency_key, request_hash
  ) values (
    p_project_id, v_actor, 'task.create', p_idempotency_key, v_request_hash
  )
  on conflict (actor_user_id, scope, idempotency_key) do nothing;

  if not found then
    select * into v_existing
    from public.idempotency_keys
    where actor_user_id = v_actor
      and scope = 'task.create'
      and idempotency_key = p_idempotency_key;

    if v_existing.request_hash <> v_request_hash then
      raise exception using errcode = '22023', message = 'Idempotency key was reused with different task input.';
    end if;

    if v_existing.status = 'completed' then
      return (v_existing.response_data ->> 'task_id')::uuid;
    end if;

    raise exception using errcode = '55000', message = 'A task request with this idempotency key is already processing.';
  end if;

  perform 1 from public.projects where id = p_project_id for update;
  if not found then
    raise exception using errcode = '22023', message = 'Project does not exist.';
  end if;

  select coalesce(max(sort_order), 0) + 1 into v_sort_order
  from public.tasks where project_id = p_project_id;
  v_reference := private.next_project_number(p_project_id, 'task', 'TSK');

  insert into public.tasks(
    id, project_id, phase_id, reference, title, description, priority,
    sort_order, planned_start, planned_end, progress_weight, created_by
  ) values (
    v_task_id, p_project_id, p_phase_id, v_reference, btrim(p_title),
    nullif(btrim(coalesce(p_description, '')), ''), p_priority,
    v_sort_order, p_planned_start, p_planned_end, p_progress_weight, v_actor
  );

  insert into public.audit_events(
    project_id, actor_user_id, action, entity_type, entity_id,
    request_id, after_state
  ) values (
    p_project_id, v_actor, 'task.created', 'task', v_task_id,
    p_idempotency_key,
    jsonb_build_object('reference', v_reference, 'title', btrim(p_title), 'status', 'not_started')
  );

  update public.idempotency_keys
  set status = 'completed',
      response_data = jsonb_build_object('task_id', v_task_id),
      completed_at = now()
  where actor_user_id = v_actor
    and scope = 'task.create'
    and idempotency_key = p_idempotency_key;

  return v_task_id;
end;
$$;

revoke all on function public.create_task(uuid, text, uuid, uuid, text, date, date, text, numeric)
  from public, anon;
grant execute on function public.create_task(uuid, text, uuid, uuid, text, date, date, text, numeric)
  to authenticated;
