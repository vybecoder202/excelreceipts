-- Local development/test identities only. No production or personal owner data.

insert into private.owner_email_allowlist(email)
values ('owner@example.test')
on conflict (email) do update set is_active = excluded.is_active;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-111111111111',
    'authenticated',
    'authenticated',
    'owner@example.test',
    extensions.crypt('local-test-only', extensions.gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Local Owner"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-4222-8222-222222222222',
    'authenticated',
    'authenticated',
    'viewer@example.test',
    extensions.crypt('local-test-only', extensions.gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Local Viewer"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-4333-8333-333333333333',
    'authenticated',
    'authenticated',
    'intruder@example.test',
    extensions.crypt('local-test-only', extensions.gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Local Intruder"}'::jsonb,
    now(),
    now()
  )
on conflict (id) do nothing;

insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
values
  (
    '11111111-1111-4111-8111-111111111110',
    '11111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    '{"sub":"11111111-1111-4111-8111-111111111111","email":"owner@example.test"}'::jsonb,
    'email',
    now(),
    now(),
    now()
  ),
  (
    '22222222-2222-4222-8222-222222222220',
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222222',
    '{"sub":"22222222-2222-4222-8222-222222222222","email":"viewer@example.test"}'::jsonb,
    'email',
    now(),
    now(),
    now()
  ),
  (
    '33333333-3333-4333-8333-333333333330',
    '33333333-3333-4333-8333-333333333333',
    '33333333-3333-4333-8333-333333333333',
    '{"sub":"33333333-3333-4333-8333-333333333333","email":"intruder@example.test"}'::jsonb,
    'email',
    now(),
    now(),
    now()
  )
on conflict (id) do nothing;
