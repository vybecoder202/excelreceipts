begin;

create extension if not exists pgtap with schema extensions;
select plan(38);

select has_table('public', 'phases', 'phases table exists');
select has_table('public', 'tasks', 'tasks table exists');
select has_table('public', 'task_dependencies', 'task dependencies table exists');
select has_table('public', 'milestones', 'milestones table exists');
select has_table('public', 'progress_updates', 'progress updates table exists');
select has_view('public', 'project_progress_summary', 'project progress summary view exists');
select has_function('public', 'create_phase', array['uuid', 'text', 'uuid', 'text', 'date', 'date'], 'create_phase command exists');
select has_function(
  'public',
  'create_task',
  array['uuid', 'text', 'uuid', 'uuid', 'text', 'date', 'date', 'text', 'numeric'],
  'create_task command exists'
);

select ok(
  (select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.phases'::regclass),
  'phases has forced RLS'
);
select ok(
  (select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.tasks'::regclass),
  'tasks has forced RLS'
);
select ok(
  (select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.milestones'::regclass),
  'milestones has forced RLS'
);
select ok(
  (select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.progress_updates'::regclass),
  'progress updates has forced RLS'
);

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","email":"owner@example.test","role":"authenticated"}',
  true
);
set local role authenticated;

select lives_ok(
  $$select public.create_project(
    'Delivery planning test',
    null,
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid
  )$$,
  'owner can create a project for delivery planning'
);

select lives_ok(
  $$select public.create_phase(
    (select id from public.projects where name = 'Delivery planning test'),
    'Substructure',
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid,
    'Foundations and ground works',
    '2026-08-17'::date,
    '2026-09-18'::date
  )$$,
  'owner can create a phase through the command'
);

select results_eq(
  $$select reference, status, sort_order, planned_start, planned_end from public.phases$$,
  $$values ('PH-2026-0001'::text, 'planned'::text, 1, '2026-08-17'::date, '2026-09-18'::date)$$,
  'phase receives a deterministic reference, order, status, and dates'
);

select is(
  public.create_phase(
    (select id from public.projects where name = 'Delivery planning test'),
    'Substructure',
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid,
    'Foundations and ground works',
    '2026-08-17'::date,
    '2026-09-18'::date
  ),
  (select id from public.phases where name = 'Substructure'),
  'replaying a phase idempotency key returns the original phase'
);

select lives_ok(
  $$select public.create_task(
    (select id from public.projects where name = 'Delivery planning test'),
    'Excavate foundation trenches',
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'::uuid,
    (select id from public.phases where name = 'Substructure'),
    null,
    '2026-08-17'::date,
    '2026-08-21'::date,
    'high',
    1
  )$$,
  'owner can create a task through the command'
);

select results_eq(
  $$select reference, status, priority, percent_complete, progress_weight from public.tasks$$,
  $$values ('TSK-2026-0001'::text, 'not_started'::text, 'high'::text, 0.00::numeric, 1.0000::numeric)$$,
  'task receives deterministic defaults without inventing progress'
);

select results_eq(
  $$select percent_complete, overdue_task_count, open_task_count from public.project_progress_summary$$,
  $$values (0.00::numeric, 0::bigint, 1::bigint)$$,
  'project progress starts at zero with one open task'
);

select throws_ok(
  $$insert into public.phases(
    project_id, reference, name, sort_order, created_by
  ) values (
    (select id from public.projects limit 1), 'PH-BYPASS', 'Bypass', 99, auth.uid()
  )$$,
  '42501',
  'permission denied for table phases',
  'authenticated owner cannot bypass the phase command'
);

reset role;

insert into public.tasks(
  id, project_id, phase_id, reference, title, sort_order, created_by
)
select
  '44444444-4444-4444-8444-444444444444',
  project.id,
  phase.id,
  'TSK-2026-9999',
  'Place blinding concrete',
  2,
  '11111111-1111-4111-8111-111111111111'
from public.projects as project
join public.phases as phase on phase.project_id = project.id
where project.name = 'Delivery planning test';

update public.tasks
set status = 'in_progress', percent_complete = 40
where title = 'Excavate foundation trenches';

insert into public.task_dependencies(
  project_id, task_id, depends_on_task_id, created_by
)
select
  project_id,
  '44444444-4444-4444-8444-444444444444',
  id,
  '11111111-1111-4111-8111-111111111111'
from public.tasks
where title = 'Excavate foundation trenches';

insert into public.milestones(
  id, project_id, phase_id, reference, title, due_date, created_by
)
select
  '66666666-6666-4666-8666-666666666666',
  project_id,
  id,
  'MS-2026-0001',
  'Foundation ready for blockwork',
  '2026-09-18'::date,
  '11111111-1111-4111-8111-111111111111'
from public.phases
where name = 'Substructure';

insert into public.progress_updates(
  project_id, phase_id, summary, overall_percent, created_by
)
select
  project_id,
  id,
  'Excavation started on the eastern side.',
  20,
  '11111111-1111-4111-8111-111111111111'
from public.phases
where name = 'Substructure';

set local role authenticated;

select results_eq(
  $$select count(*)::bigint from public.tasks$$,
  $$values (2::bigint)$$,
  'owner can read both authorized tasks'
);

select results_eq(
  $$select percent_complete, overdue_task_count, open_task_count from public.project_progress_summary$$,
  $$values (20.00::numeric, 0::bigint, 2::bigint)$$,
  'weighted project progress is calculated deterministically'
);

select results_eq(
  $$select count(*)::bigint from public.task_dependencies$$,
  $$values (1::bigint)$$,
  'owner can read task dependencies'
);

select results_eq(
  $$select count(*)::bigint from public.milestones$$,
  $$values (1::bigint)$$,
  'owner can read milestones'
);

select results_eq(
  $$select count(*)::bigint from public.progress_updates$$,
  $$values (1::bigint)$$,
  'owner can read progress history'
);

select results_eq(
  $$select count(*)::bigint from public.audit_events where action in ('phase.created', 'task.created')$$,
  $$values (2::bigint)$$,
  'phase and task commands append audit events'
);

reset role;

insert into public.project_memberships(project_id, user_id, role_code, status, invited_by, joined_at)
select id, '22222222-2222-4222-8222-222222222222', 'editor', 'active',
  '11111111-1111-4111-8111-111111111111', now()
from public.projects
where name = 'Delivery planning test';

select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","email":"viewer@example.test","role":"authenticated"}',
  true
);
set local role authenticated;

select lives_ok(
  $$select public.create_task(
    (select id from public.projects where name = 'Delivery planning test'),
    'Set out foundation walls',
    'ffffffff-ffff-4fff-8fff-ffffffffffff'::uuid,
    (select id from public.phases where name = 'Substructure')
  )$$,
  'editor can create a task through the authorized command'
);

select results_eq(
  $$select count(*)::bigint from public.tasks$$,
  $$values (3::bigint)$$,
  'editor can read authorized delivery records'
);

reset role;
update public.project_memberships
set role_code = 'read_only'
where user_id = '22222222-2222-4222-8222-222222222222';
set local role authenticated;

select throws_ok(
  $$select public.create_phase(
    (select id from public.projects where name = 'Delivery planning test'),
    'Unauthorized phase',
    '12121212-1212-4212-8212-121212121212'::uuid
  )$$,
  '42501',
  'Project owner or editor access is required.',
  'read-only member cannot create a phase'
);

select throws_ok(
  $$update public.tasks set title = 'Unauthorized edit'$$,
  '42501',
  'permission denied for table tasks',
  'read-only member cannot directly update tasks'
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
  $$select count(*)::bigint from public.phases$$,
  $$values (0::bigint)$$,
  'non-member cannot read project phases'
);

select throws_ok(
  $$select public.create_task(
    (select id from public.projects where name = 'Delivery planning test'),
    'Unauthorized task',
    '13131313-1313-4313-8313-131313131313'::uuid
  )$$,
  '42501',
  'Project owner or editor access is required.',
  'non-member cannot create a task'
);

reset role;

select throws_like(
  $$insert into public.task_dependencies(
    project_id, task_id, depends_on_task_id, created_by
  )
  select project_id, id, id, '11111111-1111-4111-8111-111111111111'
  from public.tasks where title = 'Excavate foundation trenches'$$,
  '%task_dependency_distinct%',
  'a task cannot depend on itself'
);

insert into public.projects(
  id, reference, name, created_by
) values (
  '77777777-7777-4777-8777-777777777777',
  'PRJ-2026-9999',
  'Other project',
  '33333333-3333-4333-8333-333333333333'
);

insert into public.tasks(
  id, project_id, reference, title, sort_order, created_by
) values (
  '55555555-5555-4555-8555-555555555555',
  '77777777-7777-4777-8777-777777777777',
  'TSK-2026-9998',
  'Other project task',
  1,
  '33333333-3333-4333-8333-333333333333'
);

select throws_like(
  $$insert into public.task_dependencies(
    project_id, task_id, depends_on_task_id, created_by
  )
  select
    project_id,
    id,
    '55555555-5555-4555-8555-555555555555',
    '11111111-1111-4111-8111-111111111111'
  from public.tasks where title = 'Excavate foundation trenches'$$,
  '%task_dependencies_project_id_depends_on_task_id_fkey%',
  'task dependencies cannot cross project boundaries'
);

select throws_like(
  $$insert into public.milestones(
    project_id, reference, title, due_date, status, created_by
  )
  select id, 'MS-INVALID', 'Invalid achieved milestone', current_date,
    'achieved', '11111111-1111-4111-8111-111111111111'
  from public.projects where name = 'Delivery planning test'$$,
  '%milestone_completion_consistency%',
  'achieved milestones require a completion timestamp'
);

select throws_like(
  $$update public.tasks
    set status = 'completed', percent_complete = 50, completed_at = now()
    where title = 'Excavate foundation trenches'$$,
  '%task_completion_consistency%',
  'completed tasks require exactly 100 percent progress'
);

select throws_like(
  $$insert into public.phases(
    project_id, reference, name, sort_order, planned_start, planned_end, created_by
  )
  select id, 'PH-INVALID', 'Invalid dates', 99, '2026-09-10'::date,
    '2026-09-01'::date, '11111111-1111-4111-8111-111111111111'
  from public.projects where name = 'Delivery planning test'$$,
  '%phase_planned_dates%',
  'phase end dates cannot precede start dates'
);

select throws_like(
  $$insert into public.progress_updates(
    project_id, summary, overall_percent, created_by
  )
  select id, 'Invalid progress', 101,
    '11111111-1111-4111-8111-111111111111'
  from public.projects where name = 'Delivery planning test'$$,
  '%progress_percent%',
  'progress history rejects percentages above 100'
);

select * from finish();
rollback;
