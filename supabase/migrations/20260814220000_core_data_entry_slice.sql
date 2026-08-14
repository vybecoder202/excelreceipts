-- Usable owner data-entry slice for project finances, suppliers, material setup,
-- workforce records, attendance, daily logs, and task progress. Financial and
-- inventory concepts remain deliberately separate: expenses do not move stock.

create function private.require_project_editor(p_project_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null or not private.has_project_role(p_project_id, array['owner', 'editor']) then
    raise exception using errcode = '42501', message = 'Project owner or editor access is required.';
  end if;

  return v_actor;
end;
$$;

revoke all on function private.require_project_editor(uuid)
  from public, anon, authenticated;

create function private.begin_idempotent_command(
  p_project_id uuid,
  p_scope text,
  p_idempotency_key uuid,
  p_request_hash text
)
returns table(replay boolean, existing_result_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_existing public.idempotency_keys%rowtype;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'Authentication is required.';
  end if;

  insert into public.idempotency_keys(
    project_id, actor_user_id, scope, idempotency_key, request_hash
  ) values (
    p_project_id, v_actor, p_scope, p_idempotency_key, p_request_hash
  )
  on conflict (actor_user_id, scope, idempotency_key) do nothing;

  if found then
    return query select false, null::uuid;
    return;
  end if;

  select * into v_existing
  from public.idempotency_keys
  where actor_user_id = v_actor
    and scope = p_scope
    and idempotency_key = p_idempotency_key
  for update;

  if v_existing.request_hash <> p_request_hash then
    raise exception using errcode = '22023', message = 'Idempotency key was reused with different input.';
  end if;

  if v_existing.status = 'completed' then
    return query select true, (v_existing.response_data ->> 'result_id')::uuid;
    return;
  end if;

  raise exception using errcode = '55000', message = 'A request with this idempotency key is already processing.';
end;
$$;

revoke all on function private.begin_idempotent_command(uuid, text, uuid, text)
  from public, anon, authenticated;

create function private.complete_idempotent_command(
  p_scope text,
  p_idempotency_key uuid,
  p_result_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.idempotency_keys
  set status = 'completed',
      response_data = jsonb_build_object('result_id', p_result_id),
      completed_at = now()
  where actor_user_id = auth.uid()
    and scope = p_scope
    and idempotency_key = p_idempotency_key;

  if not found then
    raise exception using errcode = '55000', message = 'Idempotency request could not be completed.';
  end if;
end;
$$;

revoke all on function private.complete_idempotent_command(text, uuid, uuid)
  from public, anon, authenticated;

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  reference text not null,
  name text not null,
  contact_name text,
  phone text,
  email text,
  status text not null default 'active',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (project_id, id),
  unique (project_id, reference),
  constraint supplier_name_not_blank check (length(btrim(name)) between 1 and 200),
  constraint supplier_contact_name_length check (contact_name is null or length(contact_name) <= 200),
  constraint supplier_phone_length check (phone is null or length(phone) <= 80),
  constraint supplier_email_length check (email is null or length(email) <= 320),
  constraint supplier_status check (status in ('active', 'inactive'))
);

create unique index suppliers_project_name_unique_idx
  on public.suppliers(project_id, lower(name))
  where archived_at is null;
create index suppliers_project_status_idx
  on public.suppliers(project_id, status, name)
  where archived_at is null;

create table public.budget_categories (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (project_id, id),
  constraint budget_category_name_not_blank check (length(btrim(name)) between 1 and 120)
);

create unique index budget_categories_project_name_unique_idx
  on public.budget_categories(project_id, lower(name))
  where archived_at is null;

create table public.budget_lines (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  category_id uuid not null,
  phase_id uuid,
  reference text not null,
  description text not null,
  original_amount numeric(18,2) not null,
  approved_amount numeric(18,2) not null,
  forecast_amount numeric(18,2) not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (project_id, id),
  unique (project_id, reference),
  foreign key (project_id, category_id) references public.budget_categories(project_id, id),
  foreign key (project_id, phase_id) references public.phases(project_id, id),
  constraint budget_line_description_not_blank check (length(btrim(description)) between 1 and 240),
  constraint budget_line_original_nonnegative check (original_amount >= 0),
  constraint budget_line_approved_nonnegative check (approved_amount >= 0),
  constraint budget_line_forecast_nonnegative check (forecast_amount >= 0)
);

create index budget_lines_project_category_idx
  on public.budget_lines(project_id, category_id, reference)
  where archived_at is null;

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  category_id uuid not null,
  phase_id uuid,
  supplier_id uuid,
  reference text not null,
  expense_date date not null,
  description text not null,
  amount numeric(18,2) not null,
  status text not null default 'posted',
  payment_status text not null default 'unpaid',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  voided_at timestamptz,
  voided_by uuid references auth.users(id),
  unique (project_id, id),
  unique (project_id, reference),
  foreign key (project_id, category_id) references public.budget_categories(project_id, id),
  foreign key (project_id, phase_id) references public.phases(project_id, id),
  foreign key (project_id, supplier_id) references public.suppliers(project_id, id),
  constraint expense_description_not_blank check (length(btrim(description)) between 1 and 500),
  constraint expense_amount_positive check (amount > 0),
  constraint expense_status check (status in ('posted', 'voided')),
  constraint expense_payment_status check (payment_status in ('unpaid', 'partial', 'paid')),
  constraint expense_void_consistency check (
    (status = 'voided' and voided_at is not null and voided_by is not null) or
    (status = 'posted' and voided_at is null and voided_by is null)
  )
);

create index expenses_project_date_idx
  on public.expenses(project_id, expense_date desc, created_at desc);
create index expenses_project_supplier_idx
  on public.expenses(project_id, supplier_id, expense_date desc)
  where status = 'posted';

create table public.stock_locations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  reference text not null,
  name text not null,
  description text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (project_id, id),
  unique (project_id, reference),
  constraint stock_location_name_not_blank check (length(btrim(name)) between 1 and 160),
  constraint stock_location_description_length check (description is null or length(description) <= 1000)
);

create unique index stock_locations_project_name_unique_idx
  on public.stock_locations(project_id, lower(name))
  where archived_at is null;

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  reference text not null,
  name text not null,
  category text,
  unit_code text not null references public.units_of_measure(code),
  reorder_level numeric(18,4) not null default 0,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (project_id, id),
  unique (project_id, reference),
  constraint material_name_not_blank check (length(btrim(name)) between 1 and 200),
  constraint material_category_length check (category is null or length(category) <= 120),
  constraint material_reorder_level_nonnegative check (reorder_level >= 0)
);

create unique index materials_project_name_unique_idx
  on public.materials(project_id, lower(name))
  where archived_at is null;
create index materials_project_category_idx
  on public.materials(project_id, category, name)
  where archived_at is null;

create table public.workers (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  reference text not null,
  full_name text not null,
  trade text,
  phone text,
  status text not null default 'active',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (project_id, id),
  unique (project_id, reference),
  constraint worker_full_name_not_blank check (length(btrim(full_name)) between 1 and 200),
  constraint worker_trade_length check (trade is null or length(trade) <= 120),
  constraint worker_phone_length check (phone is null or length(phone) <= 80),
  constraint worker_status check (status in ('active', 'inactive'))
);

create index workers_project_status_idx
  on public.workers(project_id, status, full_name)
  where archived_at is null;

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  worker_id uuid not null,
  attendance_date date not null,
  attendance_status text not null,
  notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (project_id, worker_id, attendance_date),
  foreign key (project_id, worker_id) references public.workers(project_id, id),
  constraint attendance_status check (attendance_status in ('present', 'half_day', 'absent')),
  constraint attendance_notes_length check (notes is null or length(notes) <= 1000)
);

create index attendance_project_date_idx
  on public.attendance_records(project_id, attendance_date desc, worker_id);

create table public.daily_site_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  reference text not null,
  log_date date not null,
  weather_notes text,
  work_completed text not null,
  workers_present integer not null default 0,
  delays_or_issues text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, id),
  unique (project_id, reference),
  unique (project_id, log_date),
  constraint daily_log_weather_length check (weather_notes is null or length(weather_notes) <= 2000),
  constraint daily_log_work_not_blank check (length(btrim(work_completed)) between 1 and 8000),
  constraint daily_log_workers_nonnegative check (workers_present between 0 and 100000),
  constraint daily_log_delays_length check (delays_or_issues is null or length(delays_or_issues) <= 4000)
);

create index daily_site_logs_project_date_idx
  on public.daily_site_logs(project_id, log_date desc);

create trigger suppliers_set_updated_at before update on public.suppliers
for each row execute function private.set_updated_at();
create trigger budget_categories_set_updated_at before update on public.budget_categories
for each row execute function private.set_updated_at();
create trigger budget_lines_set_updated_at before update on public.budget_lines
for each row execute function private.set_updated_at();
create trigger stock_locations_set_updated_at before update on public.stock_locations
for each row execute function private.set_updated_at();
create trigger materials_set_updated_at before update on public.materials
for each row execute function private.set_updated_at();
create trigger workers_set_updated_at before update on public.workers
for each row execute function private.set_updated_at();
create trigger daily_site_logs_set_updated_at before update on public.daily_site_logs
for each row execute function private.set_updated_at();

alter table public.suppliers enable row level security;
alter table public.budget_categories enable row level security;
alter table public.budget_lines enable row level security;
alter table public.expenses enable row level security;
alter table public.stock_locations enable row level security;
alter table public.materials enable row level security;
alter table public.workers enable row level security;
alter table public.attendance_records enable row level security;
alter table public.daily_site_logs enable row level security;

alter table public.suppliers force row level security;
alter table public.budget_categories force row level security;
alter table public.budget_lines force row level security;
alter table public.expenses force row level security;
alter table public.stock_locations force row level security;
alter table public.materials force row level security;
alter table public.workers force row level security;
alter table public.attendance_records force row level security;
alter table public.daily_site_logs force row level security;

create policy suppliers_read_member on public.suppliers for select to authenticated
using (private.has_project_role(project_id, array['owner', 'editor', 'read_only']));
create policy budget_categories_read_member on public.budget_categories for select to authenticated
using (private.has_project_role(project_id, array['owner', 'editor', 'read_only']));
create policy budget_lines_read_member on public.budget_lines for select to authenticated
using (private.has_project_role(project_id, array['owner', 'editor', 'read_only']));
create policy expenses_read_member on public.expenses for select to authenticated
using (private.has_project_role(project_id, array['owner', 'editor', 'read_only']));
create policy stock_locations_read_member on public.stock_locations for select to authenticated
using (private.has_project_role(project_id, array['owner', 'editor', 'read_only']));
create policy materials_read_member on public.materials for select to authenticated
using (private.has_project_role(project_id, array['owner', 'editor', 'read_only']));
create policy workers_read_member on public.workers for select to authenticated
using (private.has_project_role(project_id, array['owner', 'editor', 'read_only']));
create policy attendance_records_read_member on public.attendance_records for select to authenticated
using (private.has_project_role(project_id, array['owner', 'editor', 'read_only']));
create policy daily_site_logs_read_member on public.daily_site_logs for select to authenticated
using (private.has_project_role(project_id, array['owner', 'editor', 'read_only']));

revoke all on public.suppliers, public.budget_categories, public.budget_lines,
  public.expenses, public.stock_locations, public.materials, public.workers,
  public.attendance_records, public.daily_site_logs from anon, authenticated;
grant select on public.suppliers, public.budget_categories, public.budget_lines,
  public.expenses, public.stock_locations, public.materials, public.workers,
  public.attendance_records, public.daily_site_logs to authenticated;

create view public.project_financial_summary
with (security_invoker = true)
as
with budget as (
  select
    project_id,
    coalesce(sum(original_amount) filter (where archived_at is null), 0)::numeric(18,2) as original_budget,
    coalesce(sum(approved_amount) filter (where archived_at is null), 0)::numeric(18,2) as approved_budget,
    coalesce(sum(forecast_amount) filter (where archived_at is null), 0)::numeric(18,2) as budget_forecast
  from public.budget_lines
  group by project_id
), actual as (
  select
    project_id,
    coalesce(sum(amount) filter (where status = 'posted'), 0)::numeric(18,2) as actual_cost,
    count(*) filter (where status = 'posted' and payment_status <> 'paid')::bigint as unpaid_expense_count
  from public.expenses
  group by project_id
)
select
  project.id as project_id,
  coalesce(budget.original_budget, 0)::numeric(18,2) as original_budget,
  coalesce(budget.approved_budget, 0)::numeric(18,2) as approved_budget,
  0::numeric(18,2) as committed_cost,
  coalesce(actual.actual_cost, 0)::numeric(18,2) as actual_cost,
  0::numeric(18,2) as payments_made,
  (coalesce(budget.approved_budget, 0) - coalesce(actual.actual_cost, 0))::numeric(18,2) as remaining_budget,
  greatest(coalesce(budget.budget_forecast, 0), coalesce(actual.actual_cost, 0))::numeric(18,2) as forecast_final_cost,
  coalesce(actual.unpaid_expense_count, 0)::bigint as unpaid_expense_count
from public.projects as project
left join budget on budget.project_id = project.id
left join actual on actual.project_id = project.id;

revoke all on public.project_financial_summary from anon, authenticated;
grant select on public.project_financial_summary to authenticated;

create view public.project_workforce_summary
with (security_invoker = true)
as
select
  project.id as project_id,
  count(distinct worker.id) filter (
    where worker.status = 'active' and worker.archived_at is null
  )::bigint as active_worker_count,
  count(distinct attendance.worker_id) filter (
    where attendance.attendance_date = current_date
      and attendance.attendance_status in ('present', 'half_day')
  )::bigint as workers_recorded_today
from public.projects as project
left join public.workers as worker on worker.project_id = project.id
left join public.attendance_records as attendance
  on attendance.project_id = project.id and attendance.worker_id = worker.id
group by project.id;

revoke all on public.project_workforce_summary from anon, authenticated;
grant select on public.project_workforce_summary to authenticated;

create function public.create_supplier(
  p_project_id uuid,
  p_name text,
  p_idempotency_key uuid,
  p_contact_name text default null,
  p_phone text default null,
  p_email text default null
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
  v_reference text;
begin
  if length(btrim(coalesce(p_name, ''))) = 0 then
    raise exception using errcode = '22023', message = 'Supplier name is required.';
  end if;

  v_hash := encode(extensions.digest(convert_to(jsonb_build_object(
    'project_id', p_project_id,
    'name', btrim(p_name),
    'contact_name', nullif(btrim(coalesce(p_contact_name, '')), ''),
    'phone', nullif(btrim(coalesce(p_phone, '')), ''),
    'email', nullif(lower(btrim(coalesce(p_email, ''))), '')
  )::text, 'UTF8'), 'sha256'), 'hex');

  select replay, existing_result_id into v_replay, v_existing_id
  from private.begin_idempotent_command(p_project_id, 'supplier.create', p_idempotency_key, v_hash);
  if v_replay then return v_existing_id; end if;

  perform 1 from public.projects where id = p_project_id for update;
  v_reference := private.next_project_number(p_project_id, 'supplier', 'SUP');

  insert into public.suppliers(
    id, project_id, reference, name, contact_name, phone, email, created_by
  ) values (
    v_id, p_project_id, v_reference, btrim(p_name),
    nullif(btrim(coalesce(p_contact_name, '')), ''),
    nullif(btrim(coalesce(p_phone, '')), ''),
    nullif(lower(btrim(coalesce(p_email, ''))), ''), v_actor
  );

  insert into public.audit_events(project_id, actor_user_id, action, entity_type, entity_id, request_id, after_state)
  values (p_project_id, v_actor, 'supplier.created', 'supplier', v_id, p_idempotency_key,
    jsonb_build_object('reference', v_reference, 'name', btrim(p_name), 'status', 'active'));
  perform private.complete_idempotent_command('supplier.create', p_idempotency_key, v_id);
  return v_id;
end;
$$;

create function public.create_budget_item(
  p_project_id uuid,
  p_category_name text,
  p_description text,
  p_original_amount numeric,
  p_forecast_amount numeric,
  p_idempotency_key uuid,
  p_phase_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_project_editor(p_project_id);
  v_id uuid := gen_random_uuid();
  v_category_id uuid;
  v_hash text;
  v_replay boolean;
  v_existing_id uuid;
  v_reference text;
begin
  if length(btrim(coalesce(p_category_name, ''))) = 0 then
    raise exception using errcode = '22023', message = 'Budget category is required.';
  end if;
  if length(btrim(coalesce(p_description, ''))) = 0 then
    raise exception using errcode = '22023', message = 'Budget description is required.';
  end if;
  if p_original_amount < 0 or p_forecast_amount < 0 then
    raise exception using errcode = '22023', message = 'Budget amounts cannot be negative.';
  end if;
  if p_phase_id is not null and not exists (
    select 1 from public.phases where project_id = p_project_id and id = p_phase_id
  ) then
    raise exception using errcode = '22023', message = 'Budget phase does not belong to the project.';
  end if;

  v_hash := encode(extensions.digest(convert_to(jsonb_build_object(
    'project_id', p_project_id, 'category_name', btrim(p_category_name),
    'description', btrim(p_description), 'original_amount', p_original_amount,
    'forecast_amount', p_forecast_amount, 'phase_id', p_phase_id
  )::text, 'UTF8'), 'sha256'), 'hex');
  select replay, existing_result_id into v_replay, v_existing_id
  from private.begin_idempotent_command(p_project_id, 'budget_item.create', p_idempotency_key, v_hash);
  if v_replay then return v_existing_id; end if;

  perform 1 from public.projects where id = p_project_id for update;
  select id into v_category_id from public.budget_categories
  where project_id = p_project_id and lower(name) = lower(btrim(p_category_name)) and archived_at is null;
  if v_category_id is null then
    v_category_id := gen_random_uuid();
    insert into public.budget_categories(id, project_id, name, created_by)
    values (v_category_id, p_project_id, btrim(p_category_name), v_actor);
  end if;

  v_reference := private.next_project_number(p_project_id, 'budget_line', 'BUD');
  insert into public.budget_lines(
    id, project_id, category_id, phase_id, reference, description,
    original_amount, approved_amount, forecast_amount, created_by
  ) values (
    v_id, p_project_id, v_category_id, p_phase_id, v_reference, btrim(p_description),
    round(p_original_amount, 2), round(p_original_amount, 2), round(p_forecast_amount, 2), v_actor
  );

  insert into public.audit_events(project_id, actor_user_id, action, entity_type, entity_id, request_id, after_state)
  values (p_project_id, v_actor, 'budget_item.created', 'budget_line', v_id, p_idempotency_key,
    jsonb_build_object('reference', v_reference, 'description', btrim(p_description),
      'original_amount', round(p_original_amount, 2), 'approved_amount', round(p_original_amount, 2),
      'forecast_amount', round(p_forecast_amount, 2)));
  perform private.complete_idempotent_command('budget_item.create', p_idempotency_key, v_id);
  return v_id;
end;
$$;

create function public.create_expense(
  p_project_id uuid,
  p_category_id uuid,
  p_expense_date date,
  p_description text,
  p_amount numeric,
  p_idempotency_key uuid,
  p_phase_id uuid default null,
  p_supplier_id uuid default null
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
  v_reference text;
begin
  if length(btrim(coalesce(p_description, ''))) = 0 then
    raise exception using errcode = '22023', message = 'Expense description is required.';
  end if;
  if p_amount <= 0 then
    raise exception using errcode = '22023', message = 'Expense amount must be greater than zero.';
  end if;
  if not exists (select 1 from public.budget_categories where project_id = p_project_id and id = p_category_id) then
    raise exception using errcode = '22023', message = 'Expense category does not belong to the project.';
  end if;
  if p_phase_id is not null and not exists (select 1 from public.phases where project_id = p_project_id and id = p_phase_id) then
    raise exception using errcode = '22023', message = 'Expense phase does not belong to the project.';
  end if;
  if p_supplier_id is not null and not exists (select 1 from public.suppliers where project_id = p_project_id and id = p_supplier_id) then
    raise exception using errcode = '22023', message = 'Expense supplier does not belong to the project.';
  end if;

  v_hash := encode(extensions.digest(convert_to(jsonb_build_object(
    'project_id', p_project_id, 'category_id', p_category_id, 'expense_date', p_expense_date,
    'description', btrim(p_description), 'amount', p_amount, 'phase_id', p_phase_id,
    'supplier_id', p_supplier_id
  )::text, 'UTF8'), 'sha256'), 'hex');
  select replay, existing_result_id into v_replay, v_existing_id
  from private.begin_idempotent_command(p_project_id, 'expense.create', p_idempotency_key, v_hash);
  if v_replay then return v_existing_id; end if;

  perform 1 from public.projects where id = p_project_id for update;
  v_reference := private.next_project_number(p_project_id, 'expense', 'EXP');
  insert into public.expenses(
    id, project_id, category_id, phase_id, supplier_id, reference,
    expense_date, description, amount, created_by
  ) values (
    v_id, p_project_id, p_category_id, p_phase_id, p_supplier_id, v_reference,
    p_expense_date, btrim(p_description), round(p_amount, 2), v_actor
  );

  insert into public.audit_events(project_id, actor_user_id, action, entity_type, entity_id, request_id, after_state)
  values (p_project_id, v_actor, 'expense.posted', 'expense', v_id, p_idempotency_key,
    jsonb_build_object('reference', v_reference, 'amount', round(p_amount, 2),
      'expense_date', p_expense_date, 'status', 'posted', 'payment_status', 'unpaid'));
  perform private.complete_idempotent_command('expense.create', p_idempotency_key, v_id);
  return v_id;
end;
$$;

create function public.create_stock_location(
  p_project_id uuid,
  p_name text,
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
  v_reference text;
begin
  if length(btrim(coalesce(p_name, ''))) = 0 then
    raise exception using errcode = '22023', message = 'Stock location name is required.';
  end if;
  v_hash := encode(extensions.digest(convert_to(jsonb_build_object(
    'project_id', p_project_id, 'name', btrim(p_name),
    'description', nullif(btrim(coalesce(p_description, '')), '')
  )::text, 'UTF8'), 'sha256'), 'hex');
  select replay, existing_result_id into v_replay, v_existing_id
  from private.begin_idempotent_command(p_project_id, 'stock_location.create', p_idempotency_key, v_hash);
  if v_replay then return v_existing_id; end if;
  perform 1 from public.projects where id = p_project_id for update;
  v_reference := private.next_project_number(p_project_id, 'stock_location', 'LOC');
  insert into public.stock_locations(id, project_id, reference, name, description, created_by)
  values (v_id, p_project_id, v_reference, btrim(p_name),
    nullif(btrim(coalesce(p_description, '')), ''), v_actor);
  insert into public.audit_events(project_id, actor_user_id, action, entity_type, entity_id, request_id, after_state)
  values (p_project_id, v_actor, 'stock_location.created', 'stock_location', v_id, p_idempotency_key,
    jsonb_build_object('reference', v_reference, 'name', btrim(p_name)));
  perform private.complete_idempotent_command('stock_location.create', p_idempotency_key, v_id);
  return v_id;
end;
$$;

create function public.create_material(
  p_project_id uuid,
  p_name text,
  p_unit_code text,
  p_reorder_level numeric,
  p_idempotency_key uuid,
  p_category text default null
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
  v_reference text;
begin
  if length(btrim(coalesce(p_name, ''))) = 0 then
    raise exception using errcode = '22023', message = 'Material name is required.';
  end if;
  if p_reorder_level < 0 then
    raise exception using errcode = '22023', message = 'Reorder level cannot be negative.';
  end if;
  if not exists (select 1 from public.units_of_measure where code = lower(btrim(p_unit_code)) and is_active) then
    raise exception using errcode = '22023', message = 'Unit of measure is invalid.';
  end if;
  v_hash := encode(extensions.digest(convert_to(jsonb_build_object(
    'project_id', p_project_id, 'name', btrim(p_name), 'unit_code', lower(btrim(p_unit_code)),
    'reorder_level', p_reorder_level, 'category', nullif(btrim(coalesce(p_category, '')), '')
  )::text, 'UTF8'), 'sha256'), 'hex');
  select replay, existing_result_id into v_replay, v_existing_id
  from private.begin_idempotent_command(p_project_id, 'material.create', p_idempotency_key, v_hash);
  if v_replay then return v_existing_id; end if;
  perform 1 from public.projects where id = p_project_id for update;
  v_reference := private.next_project_number(p_project_id, 'material', 'MAT');
  insert into public.materials(id, project_id, reference, name, category, unit_code, reorder_level, created_by)
  values (v_id, p_project_id, v_reference, btrim(p_name),
    nullif(btrim(coalesce(p_category, '')), ''), lower(btrim(p_unit_code)), p_reorder_level, v_actor);
  insert into public.audit_events(project_id, actor_user_id, action, entity_type, entity_id, request_id, after_state)
  values (p_project_id, v_actor, 'material.created', 'material', v_id, p_idempotency_key,
    jsonb_build_object('reference', v_reference, 'name', btrim(p_name),
      'unit_code', lower(btrim(p_unit_code)), 'reorder_level', p_reorder_level));
  perform private.complete_idempotent_command('material.create', p_idempotency_key, v_id);
  return v_id;
end;
$$;

create function public.create_worker(
  p_project_id uuid,
  p_full_name text,
  p_idempotency_key uuid,
  p_trade text default null,
  p_phone text default null
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
  v_reference text;
begin
  if length(btrim(coalesce(p_full_name, ''))) = 0 then
    raise exception using errcode = '22023', message = 'Worker name is required.';
  end if;
  v_hash := encode(extensions.digest(convert_to(jsonb_build_object(
    'project_id', p_project_id, 'full_name', btrim(p_full_name),
    'trade', nullif(btrim(coalesce(p_trade, '')), ''),
    'phone', nullif(btrim(coalesce(p_phone, '')), '')
  )::text, 'UTF8'), 'sha256'), 'hex');
  select replay, existing_result_id into v_replay, v_existing_id
  from private.begin_idempotent_command(p_project_id, 'worker.create', p_idempotency_key, v_hash);
  if v_replay then return v_existing_id; end if;
  perform 1 from public.projects where id = p_project_id for update;
  v_reference := private.next_project_number(p_project_id, 'worker', 'WRK');
  insert into public.workers(id, project_id, reference, full_name, trade, phone, created_by)
  values (v_id, p_project_id, v_reference, btrim(p_full_name),
    nullif(btrim(coalesce(p_trade, '')), ''), nullif(btrim(coalesce(p_phone, '')), ''), v_actor);
  insert into public.audit_events(project_id, actor_user_id, action, entity_type, entity_id, request_id, after_state)
  values (p_project_id, v_actor, 'worker.created', 'worker', v_id, p_idempotency_key,
    jsonb_build_object('reference', v_reference, 'full_name', btrim(p_full_name), 'status', 'active'));
  perform private.complete_idempotent_command('worker.create', p_idempotency_key, v_id);
  return v_id;
end;
$$;

create function public.record_attendance(
  p_project_id uuid,
  p_worker_id uuid,
  p_attendance_date date,
  p_attendance_status text,
  p_idempotency_key uuid,
  p_notes text default null
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
  if p_attendance_status not in ('present', 'half_day', 'absent') then
    raise exception using errcode = '22023', message = 'Attendance status is invalid.';
  end if;
  if not exists (select 1 from public.workers where project_id = p_project_id and id = p_worker_id and archived_at is null) then
    raise exception using errcode = '22023', message = 'Worker does not belong to the project.';
  end if;
  v_hash := encode(extensions.digest(convert_to(jsonb_build_object(
    'project_id', p_project_id, 'worker_id', p_worker_id, 'attendance_date', p_attendance_date,
    'attendance_status', p_attendance_status,
    'notes', nullif(btrim(coalesce(p_notes, '')), '')
  )::text, 'UTF8'), 'sha256'), 'hex');
  select replay, existing_result_id into v_replay, v_existing_id
  from private.begin_idempotent_command(p_project_id, 'attendance.record', p_idempotency_key, v_hash);
  if v_replay then return v_existing_id; end if;
  insert into public.attendance_records(
    id, project_id, worker_id, attendance_date, attendance_status, notes, created_by
  ) values (
    v_id, p_project_id, p_worker_id, p_attendance_date, p_attendance_status,
    nullif(btrim(coalesce(p_notes, '')), ''), v_actor
  );
  insert into public.audit_events(project_id, actor_user_id, action, entity_type, entity_id, request_id, after_state)
  values (p_project_id, v_actor, 'attendance.recorded', 'attendance_record', v_id, p_idempotency_key,
    jsonb_build_object('worker_id', p_worker_id, 'attendance_date', p_attendance_date,
      'attendance_status', p_attendance_status));
  perform private.complete_idempotent_command('attendance.record', p_idempotency_key, v_id);
  return v_id;
end;
$$;

create function public.create_daily_site_log(
  p_project_id uuid,
  p_log_date date,
  p_work_completed text,
  p_workers_present integer,
  p_idempotency_key uuid,
  p_weather_notes text default null,
  p_delays_or_issues text default null
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
  v_reference text;
begin
  if length(btrim(coalesce(p_work_completed, ''))) = 0 then
    raise exception using errcode = '22023', message = 'Work completed is required.';
  end if;
  if p_workers_present < 0 then
    raise exception using errcode = '22023', message = 'Workers present cannot be negative.';
  end if;
  v_hash := encode(extensions.digest(convert_to(jsonb_build_object(
    'project_id', p_project_id, 'log_date', p_log_date,
    'work_completed', btrim(p_work_completed), 'workers_present', p_workers_present,
    'weather_notes', nullif(btrim(coalesce(p_weather_notes, '')), ''),
    'delays_or_issues', nullif(btrim(coalesce(p_delays_or_issues, '')), '')
  )::text, 'UTF8'), 'sha256'), 'hex');
  select replay, existing_result_id into v_replay, v_existing_id
  from private.begin_idempotent_command(p_project_id, 'daily_log.create', p_idempotency_key, v_hash);
  if v_replay then return v_existing_id; end if;
  perform 1 from public.projects where id = p_project_id for update;
  v_reference := private.next_project_number(p_project_id, 'daily_site_log', 'LOG');
  insert into public.daily_site_logs(
    id, project_id, reference, log_date, weather_notes, work_completed,
    workers_present, delays_or_issues, created_by
  ) values (
    v_id, p_project_id, v_reference, p_log_date,
    nullif(btrim(coalesce(p_weather_notes, '')), ''), btrim(p_work_completed),
    p_workers_present, nullif(btrim(coalesce(p_delays_or_issues, '')), ''), v_actor
  );
  insert into public.audit_events(project_id, actor_user_id, action, entity_type, entity_id, request_id, after_state)
  values (p_project_id, v_actor, 'daily_log.created', 'daily_site_log', v_id, p_idempotency_key,
    jsonb_build_object('reference', v_reference, 'log_date', p_log_date,
      'workers_present', p_workers_present));
  perform private.complete_idempotent_command('daily_log.create', p_idempotency_key, v_id);
  return v_id;
end;
$$;

create function public.update_task_progress(
  p_project_id uuid,
  p_task_id uuid,
  p_percent_complete numeric,
  p_status text,
  p_summary text,
  p_update_date date,
  p_idempotency_key uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_project_editor(p_project_id);
  v_update_id uuid := gen_random_uuid();
  v_task public.tasks%rowtype;
  v_hash text;
  v_replay boolean;
  v_existing_id uuid;
  v_allowed boolean := false;
begin
  if p_percent_complete < 0 or p_percent_complete > 100 then
    raise exception using errcode = '22023', message = 'Task progress must be between zero and 100.';
  end if;
  if p_status not in ('not_started', 'in_progress', 'blocked', 'completed', 'cancelled') then
    raise exception using errcode = '22023', message = 'Task status is invalid.';
  end if;
  if length(btrim(coalesce(p_summary, ''))) = 0 then
    raise exception using errcode = '22023', message = 'Progress summary is required.';
  end if;
  if (p_status = 'completed' and p_percent_complete <> 100)
    or (p_status = 'not_started' and p_percent_complete <> 0) then
    raise exception using errcode = '22023', message = 'Task status and percentage do not agree.';
  end if;

  select * into v_task from public.tasks
  where project_id = p_project_id and id = p_task_id and archived_at is null
  for update;
  if not found then
    raise exception using errcode = '22023', message = 'Task does not belong to the project.';
  end if;

  v_allowed := case v_task.status
    when 'not_started' then p_status in ('not_started', 'in_progress', 'blocked', 'completed', 'cancelled')
    when 'in_progress' then p_status in ('in_progress', 'blocked', 'completed', 'cancelled')
    when 'blocked' then p_status in ('blocked', 'in_progress', 'cancelled')
    when 'completed' then p_status = 'completed'
    when 'cancelled' then p_status = 'cancelled'
    else false
  end;
  if not v_allowed then
    raise exception using errcode = '22023', message = 'Task status transition is not allowed.';
  end if;

  v_hash := encode(extensions.digest(convert_to(jsonb_build_object(
    'project_id', p_project_id, 'task_id', p_task_id, 'percent_complete', p_percent_complete,
    'status', p_status, 'summary', btrim(p_summary), 'update_date', p_update_date
  )::text, 'UTF8'), 'sha256'), 'hex');
  select replay, existing_result_id into v_replay, v_existing_id
  from private.begin_idempotent_command(p_project_id, 'task.progress', p_idempotency_key, v_hash);
  if v_replay then return v_existing_id; end if;

  update public.tasks
  set percent_complete = round(p_percent_complete, 2),
      status = p_status,
      completed_at = case when p_status = 'completed' then coalesce(completed_at, now()) else null end
  where id = p_task_id and project_id = p_project_id;

  insert into public.progress_updates(
    id, project_id, phase_id, task_id, update_date, summary, overall_percent, created_by
  ) values (
    v_update_id, p_project_id, v_task.phase_id, p_task_id, p_update_date,
    btrim(p_summary), round(p_percent_complete, 2), v_actor
  );
  insert into public.audit_events(
    project_id, actor_user_id, action, entity_type, entity_id, request_id, before_state, after_state
  ) values (
    p_project_id, v_actor, 'task.progress_updated', 'task', p_task_id, p_idempotency_key,
    jsonb_build_object('status', v_task.status, 'percent_complete', v_task.percent_complete),
    jsonb_build_object('status', p_status, 'percent_complete', round(p_percent_complete, 2),
      'progress_update_id', v_update_id)
  );
  perform private.complete_idempotent_command('task.progress', p_idempotency_key, v_update_id);
  return v_update_id;
end;
$$;

revoke all on function public.create_supplier(uuid, text, uuid, text, text, text) from public, anon;
revoke all on function public.create_budget_item(uuid, text, text, numeric, numeric, uuid, uuid) from public, anon;
revoke all on function public.create_expense(uuid, uuid, date, text, numeric, uuid, uuid, uuid) from public, anon;
revoke all on function public.create_stock_location(uuid, text, uuid, text) from public, anon;
revoke all on function public.create_material(uuid, text, text, numeric, uuid, text) from public, anon;
revoke all on function public.create_worker(uuid, text, uuid, text, text) from public, anon;
revoke all on function public.record_attendance(uuid, uuid, date, text, uuid, text) from public, anon;
revoke all on function public.create_daily_site_log(uuid, date, text, integer, uuid, text, text) from public, anon;
revoke all on function public.update_task_progress(uuid, uuid, numeric, text, text, date, uuid) from public, anon;

grant execute on function public.create_supplier(uuid, text, uuid, text, text, text) to authenticated;
grant execute on function public.create_budget_item(uuid, text, text, numeric, numeric, uuid, uuid) to authenticated;
grant execute on function public.create_expense(uuid, uuid, date, text, numeric, uuid, uuid, uuid) to authenticated;
grant execute on function public.create_stock_location(uuid, text, uuid, text) to authenticated;
grant execute on function public.create_material(uuid, text, text, numeric, uuid, text) to authenticated;
grant execute on function public.create_worker(uuid, text, uuid, text, text) to authenticated;
grant execute on function public.record_attendance(uuid, uuid, date, text, uuid, text) to authenticated;
grant execute on function public.create_daily_site_log(uuid, date, text, integer, uuid, text, text) to authenticated;
grant execute on function public.update_task_progress(uuid, uuid, numeric, text, text, date, uuid) to authenticated;

comment on view public.project_financial_summary is
  'Deterministic project budget and posted direct-expense totals. Commitments and payments remain zero until their ledgers are implemented.';
comment on table public.materials is
  'Material catalogue only. Quantity is never stored here and will be derived from the append-only inventory movement ledger.';
comment on table public.attendance_records is
  'Project attendance records only; no wage, payroll, tax, or employment calculation is implied.';
