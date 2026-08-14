-- Construction Manager foundation: identity, project ownership, reference data,
-- audit history, idempotency, and default-deny Row Level Security.

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.owner_email_allowlist (
  email text primary key,
  is_active boolean not null default true,
  added_at timestamptz not null default now(),
  constraint owner_email_is_normalized check (email = lower(btrim(email))),
  constraint owner_email_is_plausible check (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
);

comment on table private.owner_email_allowlist is
  'Server-managed production admission allowlist. Never expose through the Data API.';

create table public.application_roles (
  code text primary key,
  name text not null,
  description text not null,
  privilege_rank smallint not null unique,
  constraint application_role_code check (code in ('owner', 'editor', 'read_only')),
  constraint application_role_rank check (privilege_rank between 1 and 100)
);

create table public.currencies (
  code text primary key,
  name text not null,
  symbol text not null,
  minor_unit smallint not null default 2,
  is_active boolean not null default true,
  constraint currency_code_iso_shape check (code ~ '^[A-Z]{3}$'),
  constraint currency_minor_unit check (minor_unit between 0 and 6)
);

create table public.units_of_measure (
  code text primary key,
  name text not null,
  category text not null,
  decimal_scale smallint not null default 3,
  is_active boolean not null default true,
  constraint unit_code_shape check (code ~ '^[a-z0-9_]{1,24}$'),
  constraint unit_decimal_scale check (decimal_scale between 0 and 6)
);

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_email_is_normalized check (email = lower(btrim(email))),
  constraint profile_display_name_not_blank check (display_name is null or length(btrim(display_name)) > 0)
);

create sequence public.project_reference_seq as bigint start with 1 increment by 1;
revoke all on sequence public.project_reference_seq from public, anon, authenticated;

create function private.next_project_reference()
returns text
language sql
volatile
security definer
set search_path = ''
as $$
  select 'PRJ-' || to_char(current_date, 'YYYY') || '-' ||
    lpad(nextval('public.project_reference_seq')::text, 4, '0');
$$;

revoke all on function private.next_project_reference() from public, anon, authenticated;

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default private.next_project_reference(),
  name text not null,
  description text,
  status text not null default 'active',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint project_name_not_blank check (length(btrim(name)) between 1 and 160),
  constraint project_description_length check (description is null or length(description) <= 4000),
  constraint project_status check (status in ('active', 'on_hold', 'completed', 'archived')),
  constraint project_archive_consistency check (
    (status = 'archived' and archived_at is not null) or
    (status <> 'archived' and archived_at is null)
  )
);

create table public.project_settings (
  project_id uuid primary key references public.projects(id) on delete cascade,
  currency_code text not null references public.currencies(code),
  timezone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_timezone_not_blank check (length(btrim(timezone)) > 0)
);

create table public.project_memberships (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_code text not null references public.application_roles(code),
  status text not null default 'active',
  invited_by uuid references auth.users(id),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (project_id, user_id),
  constraint membership_status check (status in ('invited', 'active', 'suspended', 'revoked')),
  constraint membership_joined_consistency check (
    (status = 'active' and joined_at is not null) or status <> 'active'
  )
);

create index project_memberships_user_active_idx
  on public.project_memberships(user_id, project_id)
  where status = 'active';

create table public.number_sequences (
  project_id uuid not null references public.projects(id) on delete cascade,
  entity_key text not null,
  year smallint not null,
  prefix text not null,
  current_value bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (project_id, entity_key, year),
  constraint number_sequence_entity_key check (entity_key ~ '^[a-z][a-z0-9_]{1,47}$'),
  constraint number_sequence_year check (year between 2000 and 2200),
  constraint number_sequence_prefix check (prefix ~ '^[A-Z0-9-]{1,16}$'),
  constraint number_sequence_value check (current_value >= 0)
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id),
  actor_user_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  request_id uuid,
  before_state jsonb,
  after_state jsonb,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  constraint audit_action_shape check (action ~ '^[a-z][a-z0-9_.]{2,79}$'),
  constraint audit_entity_type_shape check (entity_type ~ '^[a-z][a-z0-9_]{1,63}$'),
  constraint audit_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index audit_events_project_time_idx
  on public.audit_events(project_id, occurred_at desc);
create index audit_events_entity_idx
  on public.audit_events(entity_type, entity_id, occurred_at desc);

create table public.idempotency_keys (
  project_id uuid references public.projects(id) on delete cascade,
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null,
  idempotency_key uuid not null,
  request_hash text not null,
  status text not null default 'processing',
  response_data jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  primary key (actor_user_id, scope, idempotency_key),
  constraint idempotency_scope_shape check (scope ~ '^[a-z][a-z0-9_.]{2,79}$'),
  constraint idempotency_hash_shape check (request_hash ~ '^[0-9a-f]{64}$'),
  constraint idempotency_status check (status in ('processing', 'completed', 'failed')),
  constraint idempotency_completion_consistency check (
    (status = 'completed' and completed_at is not null and response_data is not null) or
    status <> 'completed'
  )
);

create index idempotency_expiry_idx on public.idempotency_keys(expires_at);

insert into public.application_roles(code, name, description, privilege_rank) values
  ('owner', 'Owner', 'Full project administration and approval authority.', 100),
  ('editor', 'Editor', 'May maintain permitted operational records.', 50),
  ('read_only', 'Read-only', 'May view authorized project information only.', 10);

insert into public.currencies(code, name, symbol, minor_unit) values
  ('ZMW', 'Zambian Kwacha', 'K', 2),
  ('USD', 'United States Dollar', '$', 2);

insert into public.units_of_measure(code, name, category, decimal_scale) values
  ('each', 'Each', 'count', 0),
  ('bag', 'Bag', 'count', 0),
  ('kg', 'Kilogram', 'mass', 3),
  ('tonne', 'Metric tonne', 'mass', 3),
  ('m', 'Metre', 'length', 3),
  ('m2', 'Square metre', 'area', 3),
  ('m3', 'Cubic metre', 'volume', 3),
  ('litre', 'Litre', 'volume', 3);

create function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger projects_set_updated_at
before update on public.projects
for each row execute function private.set_updated_at();

create trigger project_settings_set_updated_at
before update on public.project_settings
for each row execute function private.set_updated_at();

create trigger project_memberships_set_updated_at
before update on public.project_memberships
for each row execute function private.set_updated_at();

create function private.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is null then
    return new;
  end if;

  insert into public.profiles(user_id, email, display_name, avatar_url)
  values (
    new.id,
    lower(btrim(new.email)),
    nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')), ''),
    nullif(btrim(coalesce(new.raw_user_meta_data ->> 'avatar_url', '')), '')
  )
  on conflict (user_id) do update
    set email = excluded.email,
        display_name = coalesce(public.profiles.display_name, excluded.display_name),
        avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
        updated_at = now();

  return new;
end;
$$;

revoke all on function private.handle_auth_user_created() from public, anon, authenticated;

create trigger on_auth_user_created
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function private.handle_auth_user_created();

create function private.current_user_email()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select lower(btrim(coalesce(
    nullif(auth.jwt() ->> 'email', ''),
    (select users.email from auth.users as users where users.id = auth.uid())
  )));
$$;

revoke all on function private.current_user_email() from public, anon, authenticated;

create function private.is_initial_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1
    from private.owner_email_allowlist as allowlist
    where allowlist.email = private.current_user_email()
      and allowlist.is_active
  );
$$;

revoke all on function private.is_initial_owner() from public, anon, authenticated;

create function private.has_project_role(p_project_id uuid, p_allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.project_memberships as membership
    where membership.project_id = p_project_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role_code = any(p_allowed_roles)
  );
$$;

revoke all on function private.has_project_role(uuid, text[]) from public, anon, authenticated;
grant execute on function private.has_project_role(uuid, text[]) to authenticated;

create function private.prevent_audit_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise exception using
    errcode = '55000',
    message = 'Audit events are append-only.';
end;
$$;

create trigger audit_events_are_append_only
before update or delete on public.audit_events
for each row execute function private.prevent_audit_change();

alter table public.application_roles enable row level security;
alter table public.currencies enable row level security;
alter table public.units_of_measure enable row level security;
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_settings enable row level security;
alter table public.project_memberships enable row level security;
alter table public.number_sequences enable row level security;
alter table public.audit_events enable row level security;
alter table public.idempotency_keys enable row level security;

alter table public.application_roles force row level security;
alter table public.currencies force row level security;
alter table public.units_of_measure force row level security;
alter table public.profiles force row level security;
alter table public.projects force row level security;
alter table public.project_settings force row level security;
alter table public.project_memberships force row level security;
alter table public.number_sequences force row level security;
alter table public.audit_events force row level security;
alter table public.idempotency_keys force row level security;

create policy application_roles_authenticated_read
on public.application_roles for select to authenticated
using (true);

create policy currencies_authenticated_read
on public.currencies for select to authenticated
using (true);

create policy units_authenticated_read
on public.units_of_measure for select to authenticated
using (true);

create policy profiles_read_self
on public.profiles for select to authenticated
using (user_id = auth.uid());

create policy projects_read_member
on public.projects for select to authenticated
using (private.has_project_role(id, array['owner', 'editor', 'read_only']));

create policy project_settings_read_member
on public.project_settings for select to authenticated
using (private.has_project_role(project_id, array['owner', 'editor', 'read_only']));

create policy project_memberships_read_member
on public.project_memberships for select to authenticated
using (private.has_project_role(project_id, array['owner', 'editor', 'read_only']));

create policy audit_events_read_owner
on public.audit_events for select to authenticated
using (private.has_project_role(project_id, array['owner']));

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant select on public.application_roles, public.currencies, public.units_of_measure to authenticated;
grant select on public.profiles, public.projects, public.project_settings,
  public.project_memberships, public.audit_events to authenticated;

create function public.create_project(
  p_name text,
  p_description text default null,
  p_idempotency_key uuid default gen_random_uuid()
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_project_id uuid := gen_random_uuid();
  v_request_hash text;
  v_existing public.idempotency_keys%rowtype;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'Authentication is required.';
  end if;

  if not private.is_initial_owner() then
    raise exception using errcode = '42501', message = 'Owner email is not allowlisted.';
  end if;

  if length(btrim(coalesce(p_name, ''))) = 0 then
    raise exception using errcode = '22023', message = 'Project name is required.';
  end if;

  v_request_hash := encode(
    extensions.digest(
      convert_to(jsonb_build_object('name', btrim(p_name), 'description', p_description)::text, 'UTF8'),
      'sha256'
    ),
    'hex'
  );

  insert into public.idempotency_keys(
    project_id, actor_user_id, scope, idempotency_key, request_hash
  ) values (
    null, v_actor, 'project.create', p_idempotency_key, v_request_hash
  )
  on conflict (actor_user_id, scope, idempotency_key) do nothing;

  if not found then
    select * into v_existing
    from public.idempotency_keys
    where actor_user_id = v_actor
      and scope = 'project.create'
      and idempotency_key = p_idempotency_key;

    if v_existing.request_hash <> v_request_hash then
      raise exception using errcode = '22023', message = 'Idempotency key was reused with different input.';
    end if;

    if v_existing.status = 'completed' then
      return (v_existing.response_data ->> 'project_id')::uuid;
    end if;

    raise exception using errcode = '55000', message = 'A request with this idempotency key is already processing.';
  end if;

  insert into public.projects(id, name, description, created_by)
  values (v_project_id, btrim(p_name), nullif(btrim(coalesce(p_description, '')), ''), v_actor);

  insert into public.project_settings(project_id, currency_code, timezone)
  values (v_project_id, 'ZMW', 'Africa/Lusaka');

  insert into public.project_memberships(
    project_id, user_id, role_code, status, invited_by, joined_at
  ) values (
    v_project_id, v_actor, 'owner', 'active', v_actor, now()
  );

  insert into public.audit_events(
    project_id, actor_user_id, action, entity_type, entity_id, request_id, after_state
  ) values (
    v_project_id,
    v_actor,
    'project.created',
    'project',
    v_project_id,
    p_idempotency_key,
    jsonb_build_object('name', btrim(p_name), 'currency_code', 'ZMW', 'timezone', 'Africa/Lusaka')
  );

  update public.idempotency_keys
  set project_id = v_project_id,
      status = 'completed',
      response_data = jsonb_build_object('project_id', v_project_id),
      completed_at = now()
  where actor_user_id = v_actor
    and scope = 'project.create'
    and idempotency_key = p_idempotency_key;

  return v_project_id;
end;
$$;

revoke all on function public.create_project(text, text, uuid) from public, anon;
grant execute on function public.create_project(text, text, uuid) to authenticated;

comment on function public.create_project(text, text, uuid) is
  'Atomically creates the initial allowlisted owner project, settings, membership, audit event, and idempotency result.';
