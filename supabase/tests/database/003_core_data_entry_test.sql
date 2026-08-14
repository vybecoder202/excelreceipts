begin;

create extension if not exists pgtap with schema extensions;
select plan(59);

select has_table('public', 'suppliers', 'suppliers table exists');
select has_table('public', 'budget_categories', 'budget categories table exists');
select has_table('public', 'budget_lines', 'budget lines table exists');
select has_table('public', 'expenses', 'expenses table exists');
select has_table('public', 'stock_locations', 'stock locations table exists');
select has_table('public', 'materials', 'materials table exists');
select has_table('public', 'workers', 'workers table exists');
select has_table('public', 'attendance_records', 'attendance records table exists');
select has_table('public', 'daily_site_logs', 'daily site logs table exists');
select has_view('public', 'project_financial_summary', 'financial summary view exists');
select has_view('public', 'project_workforce_summary', 'workforce summary view exists');

select has_function('public', 'create_supplier', array['uuid', 'text', 'uuid', 'text', 'text', 'text'], 'create_supplier command exists');
select has_function('public', 'create_budget_item', array['uuid', 'text', 'text', 'numeric', 'numeric', 'uuid', 'uuid'], 'create_budget_item command exists');
select has_function('public', 'create_expense', array['uuid', 'uuid', 'date', 'text', 'numeric', 'uuid', 'uuid', 'uuid'], 'create_expense command exists');
select has_function('public', 'create_stock_location', array['uuid', 'text', 'uuid', 'text'], 'create_stock_location command exists');
select has_function('public', 'create_material', array['uuid', 'text', 'text', 'numeric', 'uuid', 'text'], 'create_material command exists');
select has_function('public', 'create_worker', array['uuid', 'text', 'uuid', 'text', 'text'], 'create_worker command exists');
select has_function('public', 'record_attendance', array['uuid', 'uuid', 'date', 'text', 'uuid', 'text'], 'record_attendance command exists');
select has_function('public', 'create_daily_site_log', array['uuid', 'date', 'text', 'integer', 'uuid', 'text', 'text'], 'create_daily_site_log command exists');
select has_function('public', 'update_task_progress', array['uuid', 'uuid', 'numeric', 'text', 'text', 'date', 'uuid'], 'update_task_progress command exists');

select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.suppliers'::regclass), 'suppliers has forced RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.budget_categories'::regclass), 'budget categories has forced RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.budget_lines'::regclass), 'budget lines has forced RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.expenses'::regclass), 'expenses has forced RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.stock_locations'::regclass), 'stock locations has forced RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.materials'::regclass), 'materials has forced RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.workers'::regclass), 'workers has forced RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.attendance_records'::regclass), 'attendance has forced RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.daily_site_logs'::regclass), 'daily logs has forced RLS');

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","email":"owner@example.test","role":"authenticated"}',
  true
);
set local role authenticated;

select lives_ok(
  $$select public.create_project(
    'Usable data entry test',
    'Core records',
    '10101010-1010-4010-8010-101010101010'::uuid
  )$$,
  'owner can create the project'
);

select lives_ok(
  $$select public.create_phase(
    (select id from public.projects where name = 'Usable data entry test'),
    'Substructure',
    '11111110-1111-4111-8111-111111111110'::uuid
  )$$,
  'owner can create a phase'
);

select lives_ok(
  $$select public.create_task(
    (select id from public.projects where name = 'Usable data entry test'),
    'Excavate foundation trenches',
    '12121210-1212-4212-8212-121212121210'::uuid,
    (select id from public.phases where name = 'Substructure')
  )$$,
  'owner can create a task'
);

select lives_ok(
  $$select public.create_supplier(
    (select id from public.projects where name = 'Usable data entry test'),
    'Lusaka Cement Supplies',
    '13131310-1313-4313-8313-131313131310'::uuid,
    'Chanda Mwila',
    '+260 97 000 0000',
    'orders@example.test'
  )$$,
  'owner can create a supplier'
);

select lives_ok(
  $$select public.create_budget_item(
    (select id from public.projects where name = 'Usable data entry test'),
    'Substructure',
    'Foundations and slab',
    50000,
    55000,
    '14141410-1414-4414-8414-141414141410'::uuid,
    (select id from public.phases where name = 'Substructure')
  )$$,
  'owner can create a budget item'
);

select lives_ok(
  $$select public.create_expense(
    (select id from public.projects where name = 'Usable data entry test'),
    (select id from public.budget_categories where name = 'Substructure'),
    current_date,
    'Site clearing and excavation deposit',
    3500,
    '15151510-1515-4515-8515-151515151510'::uuid,
    (select id from public.phases where name = 'Substructure'),
    (select id from public.suppliers where name = 'Lusaka Cement Supplies')
  )$$,
  'owner can post a direct expense'
);

select lives_ok(
  $$select public.create_stock_location(
    (select id from public.projects where name = 'Usable data entry test'),
    'Main site store',
    '16161610-1616-4616-8616-161616161610'::uuid,
    'Locked container near the site entrance'
  )$$,
  'owner can create a stock location'
);

select lives_ok(
  $$select public.create_material(
    (select id from public.projects where name = 'Usable data entry test'),
    'Cement 50 kg',
    'BAG',
    20,
    '17171710-1717-4717-8717-171717171710'::uuid,
    'Cement and binders'
  )$$,
  'owner can create a material catalogue item'
);

select lives_ok(
  $$select public.create_worker(
    (select id from public.projects where name = 'Usable data entry test'),
    'Moses Banda',
    '18181810-1818-4818-8818-181818181810'::uuid,
    'Bricklayer',
    '+260 96 000 0000'
  )$$,
  'owner can create a worker record'
);

select lives_ok(
  $$select public.record_attendance(
    (select id from public.projects where name = 'Usable data entry test'),
    (select id from public.workers where full_name = 'Moses Banda'),
    current_date,
    'present',
    '19191910-1919-4919-8919-191919191910'::uuid,
    'Foundation setting out'
  )$$,
  'owner can record attendance without calculating wages'
);

select lives_ok(
  $$select public.create_daily_site_log(
    (select id from public.projects where name = 'Usable data entry test'),
    current_date,
    'Set out foundation trenches and cleared loose soil.',
    4,
    '20202020-2020-4020-8020-202020202020'::uuid,
    'Dry and sunny',
    null
  )$$,
  'owner can create a daily site log'
);

select lives_ok(
  $$select public.update_task_progress(
    (select id from public.projects where name = 'Usable data entry test'),
    (select id from public.tasks where title = 'Excavate foundation trenches'),
    35,
    'in_progress',
    'Trench excavation started on the eastern side.',
    current_date,
    '21212120-2121-4121-8121-212121212120'::uuid
  )$$,
  'owner can record task status and progress together'
);

select results_eq(
  $$select
    (select reference from public.suppliers),
    (select reference from public.budget_lines),
    (select reference from public.expenses),
    (select reference from public.stock_locations),
    (select reference from public.materials),
    (select reference from public.workers),
    (select reference from public.daily_site_logs)$$,
  $$values ('SUP-2026-0001'::text, 'BUD-2026-0001'::text, 'EXP-2026-0001'::text,
    'LOC-2026-0001'::text, 'MAT-2026-0001'::text, 'WRK-2026-0001'::text,
    'LOG-2026-0001'::text)$$,
  'new records receive human-readable project references'
);

select results_eq(
  $$select approved_budget, committed_cost, actual_cost, payments_made,
      remaining_budget, forecast_final_cost, unpaid_expense_count
    from public.project_financial_summary$$,
  $$values (50000.00::numeric, 0.00::numeric, 3500.00::numeric, 0.00::numeric,
    46500.00::numeric, 55000.00::numeric, 1::bigint)$$,
  'financial totals keep budget, commitments, actuals, and payments distinct'
);

select results_eq(
  $$select percent_complete, open_task_count from public.project_progress_summary$$,
  $$values (35.00::numeric, 1::bigint)$$,
  'task progress updates the deterministic weighted project summary'
);

select results_eq(
  $$select active_worker_count, workers_recorded_today from public.project_workforce_summary$$,
  $$values (1::bigint, 1::bigint)$$,
  'workforce summary counts active workers and attendance records'
);

select hasnt_column('public', 'materials', 'quantity', 'material catalogue does not store editable stock quantity');

select results_eq(
  $$select count(*)::bigint from public.audit_events
    where action in (
      'project.created', 'phase.created', 'task.created', 'supplier.created',
      'budget_item.created', 'expense.posted', 'stock_location.created',
      'material.created', 'worker.created', 'attendance.recorded',
      'daily_log.created', 'task.progress_updated'
    )$$,
  $$values (12::bigint)$$,
  'every completed command appends an audit event'
);

select is(
  public.create_supplier(
    (select id from public.projects where name = 'Usable data entry test'),
    'Lusaka Cement Supplies',
    '13131310-1313-4313-8313-131313131310'::uuid,
    'Chanda Mwila',
    '+260 97 000 0000',
    'orders@example.test'
  ),
  (select id from public.suppliers where name = 'Lusaka Cement Supplies'),
  'replaying a command returns the existing record'
);

select throws_ok(
  $$insert into public.expenses(
    project_id, category_id, reference, expense_date, description, amount, created_by
  ) select project.id, category.id, 'EXP-BYPASS', current_date, 'Bypass', 1, auth.uid()
    from public.projects as project
    join public.budget_categories as category on category.project_id = project.id$$,
  '42501',
  'permission denied for table expenses',
  'authenticated owners cannot bypass the audited expense command'
);

select results_eq(
  $$select
    (select count(*) from public.suppliers),
    (select count(*) from public.budget_lines),
    (select count(*) from public.expenses),
    (select count(*) from public.materials),
    (select count(*) from public.workers),
    (select count(*) from public.daily_site_logs)$$,
  $$values (1::bigint, 1::bigint, 1::bigint, 1::bigint, 1::bigint, 1::bigint)$$,
  'owner can read every authorized core record type'
);

reset role;
insert into public.project_memberships(project_id, user_id, role_code, status, invited_by, joined_at)
select id, '22222222-2222-4222-8222-222222222222', 'read_only', 'active',
  '11111111-1111-4111-8111-111111111111', now()
from public.projects where name = 'Usable data entry test';

select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","email":"viewer@example.test","role":"authenticated"}',
  true
);
set local role authenticated;

select results_eq(
  $$select count(*)::bigint from public.suppliers$$,
  $$values (1::bigint)$$,
  'read-only members can review authorized records'
);

select throws_ok(
  $$select public.create_supplier(
    (select id from public.projects where name = 'Usable data entry test'),
    'Unauthorized supplier',
    '22222220-2222-4222-8222-222222222220'::uuid
  )$$,
  '42501',
  'Project owner or editor access is required.',
  'read-only members cannot create suppliers'
);

reset role;
select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"33333333-3333-4333-8333-333333333333","email":"intruder@example.test","role":"authenticated"}',
  true
);
set local role authenticated;

select results_eq(
  $$select count(*)::bigint from public.suppliers$$,
  $$values (0::bigint)$$,
  'non-members cannot read suppliers'
);

select results_eq(
  $$select count(*)::bigint from public.project_financial_summary$$,
  $$values (0::bigint)$$,
  'non-members cannot read project financial summaries'
);

select throws_ok(
  $$select public.create_worker(
    (select id from public.projects where name = 'Usable data entry test'),
    'Unauthorized worker',
    '23232320-2323-4323-8323-232323232320'::uuid
  )$$,
  '42501',
  'Project owner or editor access is required.',
  'non-members cannot create workers'
);

reset role;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","email":"owner@example.test","role":"authenticated"}',
  true
);
set local role authenticated;

select throws_ok(
  $$select public.create_expense(
    (select id from public.projects where name = 'Usable data entry test'),
    (select id from public.budget_categories where name = 'Substructure'),
    current_date,
    'Invalid supplier link',
    10,
    '24242420-2424-4424-8424-242424242420'::uuid,
    null,
    '99999999-9999-4999-8999-999999999999'::uuid
  )$$,
  '22023',
  'Expense supplier does not belong to the project.',
  'expense commands reject untrusted related record identifiers'
);

select throws_ok(
  $$select public.update_task_progress(
    (select id from public.projects where name = 'Usable data entry test'),
    (select id from public.tasks where title = 'Excavate foundation trenches'),
    0,
    'not_started',
    'Attempt to move backwards',
    current_date,
    '25252520-2525-4525-8525-252525252520'::uuid
  )$$,
  '22023',
  'Task status transition is not allowed.',
  'task progress rejects invalid backwards transitions'
);

reset role;

select throws_like(
  $$insert into public.budget_lines(
    project_id, category_id, reference, description, original_amount,
    approved_amount, forecast_amount, created_by
  ) select project.id, category.id, 'BUD-INVALID', 'Negative budget', -1, 0, 0,
      '11111111-1111-4111-8111-111111111111'
    from public.projects as project
    join public.budget_categories as category on category.project_id = project.id
    where project.name = 'Usable data entry test'$$,
  '%budget_line_original_nonnegative%',
  'database constraints reject negative budget values'
);

select throws_like(
  $$insert into public.attendance_records(
    project_id, worker_id, attendance_date, attendance_status, created_by
  ) select project_id, id, current_date, 'present',
      '11111111-1111-4111-8111-111111111111'
    from public.workers where full_name = 'Moses Banda'$$,
  '%attendance_records_project_id_worker_id_attendance_date_key%',
  'a worker cannot receive duplicate attendance for the same date'
);

select * from finish();
rollback;
