begin;

create extension if not exists pgtap with schema extensions;
select plan(20);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'projects', 'projects table exists');
select has_table('public', 'project_memberships', 'project memberships table exists');
select has_table('public', 'audit_events', 'audit events table exists');
select has_function('public', 'create_project', array['text', 'text', 'uuid'], 'create_project command exists');

select ok(
  (select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.projects'::regclass),
  'projects has forced RLS'
);
select ok(
  (select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.project_memberships'::regclass),
  'project memberships has forced RLS'
);
select ok(
  (select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.audit_events'::regclass),
  'audit events has forced RLS'
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
    'Local House Build',
    'Database security test project',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid
  )$$,
  'allowlisted owner can create the initial project'
);

select results_eq(
  $$select count(*)::bigint from public.projects$$,
  $$values (1::bigint)$$,
  'owner can read the created project'
);

select results_eq(
  $$select currency_code, timezone from public.project_settings$$,
  $$values ('ZMW'::text, 'Africa/Lusaka'::text)$$,
  'project receives confirmed currency and timezone defaults'
);

select results_eq(
  $$select role_code, status from public.project_memberships where user_id = auth.uid()$$,
  $$values ('owner'::text, 'active'::text)$$,
  'project creation atomically assigns active owner membership'
);

select results_eq(
  $$select action from public.audit_events$$,
  $$values ('project.created'::text)$$,
  'owner can read the project creation audit event'
);

select is(
  public.create_project(
    'Local House Build',
    'Database security test project',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid
  ),
  (select id from public.projects where name = 'Local House Build'),
  'replaying the same idempotency key returns the original project'
);

select throws_ok(
  $$insert into public.projects(name, created_by) values ('Bypass', auth.uid())$$,
  '42501',
  'permission denied for table projects',
  'authenticated users cannot bypass the create_project command'
);

reset role;

insert into public.project_memberships(project_id, user_id, role_code, status, invited_by, joined_at)
select id, '22222222-2222-4222-8222-222222222222', 'read_only', 'active',
  '11111111-1111-4111-8111-111111111111', now()
from public.projects
where name = 'Local House Build';

select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"33333333-3333-4333-8333-333333333333","email":"intruder@example.test","role":"authenticated"}',
  true
);
set local role authenticated;

select results_eq(
  $$select count(*)::bigint from public.projects$$,
  $$values (0::bigint)$$,
  'authenticated non-member cannot read another project'
);

select throws_ok(
  $$select public.create_project('Unauthorized Project', null, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid)$$,
  '42501',
  'Owner email is not allowlisted.',
  'non-allowlisted email cannot create a project'
);

reset role;
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","email":"viewer@example.test","role":"authenticated"}',
  true
);
set local role authenticated;

select results_eq(
  $$select count(*)::bigint from public.projects$$,
  $$values (1::bigint)$$,
  'read-only member can read the project'
);

select throws_ok(
  $$update public.projects set name = 'Unauthorized Edit'$$,
  '42501',
  'permission denied for table projects',
  'read-only member cannot update the project'
);

reset role;

select throws_ok(
  $$update public.audit_events set metadata = '{"tampered":true}'::jsonb$$,
  '55000',
  'Audit events are append-only.',
  'audit events cannot be modified even by a privileged database session'
);

select * from finish();
rollback;
