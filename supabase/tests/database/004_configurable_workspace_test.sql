begin;

create extension if not exists pgtap with schema extensions;
select plan(45);

select has_table('public', 'data_tables', 'configurable tables exist');
select has_table('public', 'data_fields', 'configurable fields exist');
select has_table('public', 'data_records', 'configurable records exist');
select has_table('public', 'data_cells', 'typed cells exist');
select has_table('public', 'data_record_links', 'linked records exist');
select has_table('public', 'data_views', 'configurable views exist');
select has_table('public', 'data_forms', 'configurable forms exist');
select has_table('public', 'data_form_fields', 'form field layout exists');
select has_table('public', 'data_interfaces', 'configurable interfaces exist');
select has_table('public', 'data_interface_blocks', 'interface blocks exist');

select has_function('public', 'create_data_table', array['uuid', 'text', 'uuid', 'text', 'text'], 'create table command exists');
select has_function('public', 'create_data_field', array['uuid', 'uuid', 'text', 'text', 'uuid', 'boolean', 'jsonb', 'uuid', 'uuid', 'uuid'], 'create field command exists');
select has_function('public', 'save_data_record', array['uuid', 'uuid', 'jsonb', 'jsonb', 'uuid', 'uuid'], 'save record command exists');
select has_function('public', 'archive_data_record', array['uuid', 'uuid', 'uuid'], 'archive record command exists');
select has_function('public', 'create_data_view', array['uuid', 'uuid', 'text', 'text', 'uuid'], 'create view command exists');
select has_function('public', 'create_data_form', array['uuid', 'uuid', 'text', 'uuid', 'text', 'text'], 'create form command exists');
select has_function('public', 'create_data_interface', array['uuid', 'text', 'uuid', 'uuid', 'text'], 'create interface command exists');
select has_function('public', 'install_construction_workspace', array['uuid', 'uuid'], 'construction starter command exists');

select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.data_tables'::regclass), 'data tables have forced RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.data_records'::regclass), 'data records have forced RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.data_cells'::regclass), 'data cells have forced RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.data_record_links'::regclass), 'record links have forced RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.data_forms'::regclass), 'forms have forced RLS');

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","email":"owner@example.test","role":"authenticated"}',
  true
);
set local role authenticated;

select lives_ok(
  $$select public.create_project(
    'Workspace builder test',
    'Metadata-driven project base',
    '30303030-3030-4030-8030-303030303030'::uuid
  )$$,
  'owner can create the builder project'
);

select lives_ok(
  $$select public.install_construction_workspace(
    (select id from public.projects where name = 'Workspace builder test'),
    '31313131-3131-4131-8131-313131313131'::uuid
  )$$,
  'owner can install the construction starter atomically'
);

select results_eq(
  $$select count(*)::bigint from public.data_tables$$,
  $$values (8::bigint)$$,
  'construction starter creates eight configurable tables'
);

select results_eq(
  $$select count(*)::bigint from public.data_fields$$,
  $$values (43::bigint)$$,
  'construction starter creates all stored, linked, and lookup fields'
);

select results_eq(
  $$select count(*)::bigint from public.data_fields where field_type = 'link'$$,
  $$values (6::bigint)$$,
  'construction starter creates six linked-record dependencies'
);

select results_eq(
  $$select count(*)::bigint from public.data_fields where field_type = 'lookup'$$,
  $$values (2::bigint)$$,
  'construction starter creates two cross-table lookups'
);

select results_eq(
  $$select count(*)::bigint from public.data_views$$,
  $$values (10::bigint)$$,
  'starter creates grid plus specialized views'
);

select results_eq(
  $$select count(*)::bigint from public.data_forms$$,
  $$values (2::bigint)$$,
  'starter creates expense and site log forms'
);

select results_eq(
  $$select count(*)::bigint from public.data_interface_blocks$$,
  $$values (5::bigint)$$,
  'starter interface contains live metric and list blocks'
);

select lives_ok(
  $$select public.save_data_record(
    (select id from public.projects where name = 'Workspace builder test'),
    (select id from public.data_tables where name = 'Suppliers'),
    jsonb_build_object(
      (select id::text from public.data_fields where table_id = (select id from public.data_tables where name = 'Suppliers') and is_primary),
      'Lusaka Cement Supplies'
    ),
    '{}'::jsonb,
    '32323232-3232-4232-8232-323232323232'::uuid
  )$$,
  'owner can create a dynamic supplier record'
);

select lives_ok(
  $$select public.save_data_record(
    (select id from public.projects where name = 'Workspace builder test'),
    (select id from public.data_tables where name = 'Expenses'),
    jsonb_build_object(
      (select id::text from public.data_fields where table_id = (select id from public.data_tables where name = 'Expenses') and name = 'Description'), 'Site clearing',
      (select id::text from public.data_fields where table_id = (select id from public.data_tables where name = 'Expenses') and name = 'Amount'), '3500.00',
      (select id::text from public.data_fields where table_id = (select id from public.data_tables where name = 'Expenses') and name = 'Expense date'), current_date::text
    ),
    jsonb_build_object(
      (select id::text from public.data_fields where table_id = (select id from public.data_tables where name = 'Expenses') and name = 'Supplier'),
      jsonb_build_array((select record.id from public.data_records as record join public.data_tables as table_data on table_data.id = record.table_id where table_data.name = 'Suppliers'))
    ),
    '33333333-3333-4333-8333-333333333330'::uuid
  )$$,
  'owner can save typed values and a validated cross-table relationship'
);

select results_eq(
  $$select count(*)::bigint from public.data_records$$,
  $$values (2::bigint)$$,
  'two dynamic records were saved'
);

select results_eq(
  $$select cell.number_value from public.data_cells as cell join public.data_fields as field on field.id = cell.field_id where field.name = 'Amount'$$,
  $$values (3500.00::numeric)$$,
  'currency cells are stored as PostgreSQL numeric values'
);

select results_eq(
  $$select count(*)::bigint from public.data_record_links$$,
  $$values (1::bigint)$$,
  'expense-to-supplier relationship is stored separately from scalar cells'
);

select throws_ok(
  $$select public.save_data_record(
    (select id from public.projects where name = 'Workspace builder test'),
    (select id from public.data_tables where name = 'Tasks'),
    '{}'::jsonb,
    '{}'::jsonb,
    '34343434-3434-4434-8434-343434343434'::uuid
  )$$,
  '23514',
  'Every required field needs a value.',
  'required dynamic fields are enforced in the database'
);

select throws_ok(
  $$select public.save_data_record(
    (select id from public.projects where name = 'Workspace builder test'),
    (select id from public.data_tables where name = 'Tasks'),
    jsonb_build_object(
      (select id::text from public.data_fields where table_id = (select id from public.data_tables where name = 'Tasks') and is_primary), 'Invalid relationship'
    ),
    jsonb_build_object(
      (select id::text from public.data_fields where table_id = (select id from public.data_tables where name = 'Tasks') and name = 'Phase'),
      jsonb_build_array((select record.id from public.data_records as record join public.data_tables as table_data on table_data.id = record.table_id where table_data.name = 'Suppliers'))
    ),
    '35353535-3535-4535-8535-353535353535'::uuid
  )$$,
  '23514',
  'Linked records must follow the configured field relationship.',
  'cross-table links cannot target the wrong configured table'
);

select lives_ok(
  $$select public.create_data_field(
    (select id from public.projects where name = 'Workspace builder test'),
    (select id from public.data_tables where name = 'Expenses'),
    'Amount copy',
    'formula',
    '36363636-3636-4636-8636-363636363636'::uuid,
    false,
    jsonb_build_object(
      'operator', 'sum',
      'sourceFieldIds', jsonb_build_array((select id from public.data_fields where table_id = (select id from public.data_tables where name = 'Expenses') and name = 'Amount'))
    )
  )$$,
  'formula fields can depend on stored fields in the same table'
);

select throws_ok(
  $$select public.archive_data_record(
    (select id from public.projects where name = 'Workspace builder test'),
    (select record.id from public.data_records as record join public.data_tables as table_data on table_data.id = record.table_id where table_data.name = 'Suppliers'),
    '37373737-3737-4737-8737-373737373737'::uuid
  )$$,
  '23514',
  'Unlink this record from active records before archiving it.',
  'linked target records cannot be archived while active records depend on them'
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
  $$select count(*)::bigint from public.data_tables$$,
  $$values (0::bigint)$$,
  'non-members cannot read configurable table definitions'
);

select results_eq(
  $$select count(*)::bigint from public.data_records$$,
  $$values (0::bigint)$$,
  'non-members cannot read configurable records'
);

select throws_ok(
  $$select public.create_data_table(
    (select id from public.projects where name = 'Workspace builder test'),
    'Unauthorized table',
    '38383838-3838-4838-8838-383838383838'::uuid
  )$$,
  '42501',
  'Project owner or editor access is required.',
  'non-members cannot create configurable tables'
);

select throws_like(
  $$insert into public.data_records(project_id, table_id, created_by, updated_by)
    values (
      '99999999-9999-4999-8999-999999999999',
      '99999999-9999-4999-8999-999999999998',
      '33333333-3333-4333-8333-333333333333',
      '33333333-3333-4333-8333-333333333333'
    )$$,
  '%permission denied%',
  'authenticated clients cannot bypass commands with direct inserts'
);

select * from finish();
rollback;
