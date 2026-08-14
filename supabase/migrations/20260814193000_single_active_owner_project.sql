-- The current application has no project switcher. Prevent a second active
-- owner project from being created until multi-project ownership is designed.

create unique index one_active_owned_project_per_user_idx
  on public.project_memberships(user_id)
  where role_code = 'owner' and status = 'active';

comment on index public.one_active_owned_project_per_user_idx is
  'Temporary product invariant: one active owned project per user until project switching is implemented.';
