begin;

create extension if not exists pgtap with schema extensions;
select plan(34);

select has_table('public', 'data_record_comments', 'record comments table exists');
select has_column('public', 'data_records', 'position', 'records have a stable ordering key');
select has_function('public', 'create_positioned_data_record', array['uuid', 'uuid', 'jsonb', 'jsonb', 'uuid', 'text', 'uuid'], 'positioned record command exists');
select has_function('public', 'duplicate_data_record', array['uuid', 'uuid', 'uuid'], 'duplicate record command exists');
select has_function('public', 'reorder_data_fields', array['uuid', 'uuid', 'uuid[]', 'uuid'], 'field reorder command exists');
select has_function('public', 'archive_data_field', array['uuid', 'uuid', 'uuid'], 'field archive command exists');
select has_function('public', 'archive_data_table', array['uuid', 'uuid', 'uuid'], 'table archive command exists');
select has_function('public', 'create_data_record_comment', array['uuid', 'uuid', 'text', 'uuid'], 'record comment command exists');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.data_record_comments'::regclass), 'record comments have forced RLS');

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","email":"owner@example.test","role":"authenticated"}',
  true
);
set local role authenticated;

select lives_ok(
  $$select public.create_project(
    'Grid interactions test',
    'Airtable-style interactions',
    '41414141-4141-4141-8141-414141414141'::uuid
  )$$,
  'owner can create the test project'
);

select lives_ok(
  $$select public.create_data_table(
    (select id from public.projects where name = 'Grid interactions test'),
    'Deliveries',
    '42424242-4242-4242-8242-424242424242'::uuid
  )$$,
  'owner can create a table for interaction tests'
);

select lives_ok(
  $$select public.create_data_field(
    (select id from public.projects where name = 'Grid interactions test'),
    (select id from public.data_tables where name = 'Deliveries'),
    'Status',
    'single_select',
    '43434343-4343-4343-8343-434343434343'::uuid,
    false,
    '{"options":["Expected","Received"]}'::jsonb
  )$$,
  'a select field can be added'
);

select lives_ok(
  $$select public.create_data_field(
    (select id from public.projects where name = 'Grid interactions test'),
    (select id from public.data_tables where name = 'Deliveries'),
    'Notes',
    'long_text',
    '44444444-4444-4444-8444-444444444444'::uuid
  )$$,
  'a removable field can be added'
);

select lives_ok(
  $$select public.save_data_record(
    (select id from public.projects where name = 'Grid interactions test'),
    (select id from public.data_tables where name = 'Deliveries'),
    jsonb_build_object(
      (select id::text from public.data_fields where table_id = (select id from public.data_tables where name = 'Deliveries') and is_primary), 'First delivery'
    ),
    '{}'::jsonb,
    '45454545-4545-4545-8545-454545454545'::uuid
  )$$,
  'the first inline-style record can be saved'
);

select lives_ok(
  $$select public.save_data_record(
    (select id from public.projects where name = 'Grid interactions test'),
    (select id from public.data_tables where name = 'Deliveries'),
    jsonb_build_object(
      (select id::text from public.data_fields where table_id = (select id from public.data_tables where name = 'Deliveries') and is_primary), 'Second delivery'
    ),
    '{}'::jsonb,
    '46464646-4646-4646-8646-464646464646'::uuid
  )$$,
  'the second inline-style record can be saved'
);

select results_eq(
  $$select position from public.data_records order by record_number$$,
  $$values (1024.000000::numeric), (2048.000000::numeric)$$,
  'ordinary record creation appends stable positions'
);

select lives_ok(
  $$select public.create_positioned_data_record(
    (select id from public.projects where name = 'Grid interactions test'),
    (select id from public.data_tables where name = 'Deliveries'),
    jsonb_build_object(
      (select id::text from public.data_fields where table_id = (select id from public.data_tables where name = 'Deliveries') and is_primary), 'Inserted delivery'
    ),
    '{}'::jsonb,
    (select record.id from public.data_records as record join public.data_cells as cell on cell.record_id = record.id where cell.text_value = 'Second delivery'),
    'above',
    '47474747-4747-4747-8747-474747474747'::uuid
  )$$,
  'a record can be inserted above another record'
);

select results_eq(
  $$select record.position from public.data_records as record join public.data_cells as cell on cell.record_id = record.id where cell.text_value = 'Inserted delivery'$$,
  $$values (1536.000000::numeric)$$,
  'insert above uses a midpoint ordering key'
);

select lives_ok(
  $$select public.duplicate_data_record(
    (select id from public.projects where name = 'Grid interactions test'),
    (select record.id from public.data_records as record join public.data_cells as cell on cell.record_id = record.id where cell.text_value = 'Second delivery'),
    '48484848-4848-4848-8848-484848484848'::uuid
  )$$,
  'a record can be duplicated below itself'
);

select results_eq(
  $$select count(*)::bigint from public.data_records where archived_at is null$$,
  $$values (4::bigint)$$,
  'record duplication creates one additional active row'
);

select lives_ok(
  $$select public.create_data_record_comment(
    (select id from public.projects where name = 'Grid interactions test'),
    (select record.id from public.data_records as record join public.data_cells as cell on cell.record_id = record.id where cell.text_value = 'First delivery'),
    'Confirm the delivery note before unloading.',
    '49494949-4949-4949-8949-494949494949'::uuid
  )$$,
  'a comment can be added from the record menu'
);

select results_eq(
  $$select body from public.data_record_comments$$,
  $$values ('Confirm the delivery note before unloading.'::text)$$,
  'the comment is attached to the record'
);

select lives_ok(
  $$select public.reorder_data_fields(
    (select id from public.projects where name = 'Grid interactions test'),
    (select id from public.data_tables where name = 'Deliveries'),
    array[
      (select id from public.data_fields where table_id = (select id from public.data_tables where name = 'Deliveries') and name = 'Status'),
      (select id from public.data_fields where table_id = (select id from public.data_tables where name = 'Deliveries') and is_primary),
      (select id from public.data_fields where table_id = (select id from public.data_tables where name = 'Deliveries') and name = 'Notes')
    ],
    '50505050-5050-4050-8050-505050505050'::uuid
  )$$,
  'all active fields can be reordered atomically'
);

select results_eq(
  $$select name from public.data_fields where table_id = (select id from public.data_tables where name = 'Deliveries') and archived_at is null order by position$$,
  $$values ('Status'::text), ('Name'::text), ('Notes'::text)$$,
  'field positions reflect the requested column order'
);

select lives_ok(
  $$select public.archive_data_field(
    (select id from public.projects where name = 'Grid interactions test'),
    (select id from public.data_fields where table_id = (select id from public.data_tables where name = 'Deliveries') and name = 'Notes'),
    '51515151-5151-4151-8151-515151515151'::uuid
  )$$,
  'a non-primary field can be safely deleted'
);

select results_eq(
  $$select count(*)::bigint from public.data_fields where table_id = (select id from public.data_tables where name = 'Deliveries') and archived_at is null$$,
  $$values (2::bigint)$$,
  'deleted fields disappear from the active schema'
);

select throws_ok(
  $$select public.archive_data_field(
    (select id from public.projects where name = 'Grid interactions test'),
    (select id from public.data_fields where table_id = (select id from public.data_tables where name = 'Deliveries') and is_primary),
    '52525252-5252-4252-8252-525252525252'::uuid
  )$$,
  '23514',
  'The primary field cannot be deleted.',
  'the primary field remains protected'
);

select lives_ok(
  $$select public.create_data_table(
    (select id from public.projects where name = 'Grid interactions test'),
    'Suppliers',
    '53535353-5353-4353-8353-535353535353'::uuid
  )$$,
  'a linked target table can be created'
);

select lives_ok(
  $$select public.create_data_field(
    (select id from public.projects where name = 'Grid interactions test'),
    (select id from public.data_tables where name = 'Deliveries'),
    'Supplier',
    'link',
    '54545454-5454-4454-8454-545454545454'::uuid,
    false,
    '{}'::jsonb,
    (select id from public.data_tables where name = 'Suppliers')
  )$$,
  'a linked-record field can depend on the target table'
);

select throws_ok(
  $$select public.archive_data_table(
    (select id from public.projects where name = 'Grid interactions test'),
    (select id from public.data_tables where name = 'Suppliers'),
    '55555555-5555-4555-8555-555555555555'::uuid
  )$$,
  '23514',
  'Remove fields in other tables that link to this table before deleting it.',
  'a table with active incoming field dependencies cannot be deleted'
);

select lives_ok(
  $$select public.archive_data_field(
    (select id from public.projects where name = 'Grid interactions test'),
    (select id from public.data_fields where table_id = (select id from public.data_tables where name = 'Deliveries') and name = 'Supplier'),
    '56565656-5656-4656-8656-565656565656'::uuid
  )$$,
  'the linking field can be deleted first'
);

select lives_ok(
  $$select public.archive_data_table(
    (select id from public.projects where name = 'Grid interactions test'),
    (select id from public.data_tables where name = 'Suppliers'),
    '57575757-5757-4757-8757-575757575757'::uuid
  )$$,
  'an unreferenced table can be safely deleted'
);

select results_eq(
  $$select count(*)::bigint from public.data_tables where name = 'Suppliers' and archived_at is not null$$,
  $$values (1::bigint)$$,
  'deleted tables remain in the recoverable audit-backed archive'
);

select results_eq(
  $$select count(distinct action)::bigint from public.audit_events where action in (
    'data_field.archived', 'data_fields.reordered', 'data_record.commented',
    'data_record.duplicated', 'data_record.created', 'data_table.archived'
  )$$,
  $$values (6::bigint)$$,
  'all new grid mutations emit audit events'
);

select * from finish();
rollback;
