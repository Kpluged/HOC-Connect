-- Hand-authored (Drizzle can't diff CREATE FUNCTION). Must apply after
-- 0000_app_tables.sql (function bodies reference app.platform_roles and
-- app.organization_memberships - LANGUAGE SQL functions are parse-analyzed
-- against the catalog at CREATE FUNCTION time, unlike PL/pgSQL) and before
-- 0002_rls_policies.sql, whose policies reference these functions by name.
-- See docs/HOC-Connect-architecture-and-schema.md section 7.

create schema if not exists private;

create or replace function private.is_hoc_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from app.platform_roles pr
      where pr.user_id = (select auth.uid())
        and pr.role in ('hoc_staff', 'hoc_admin')
        and pr.status = 'active'
    );
$$;

create or replace function private.has_org_role(
  target_organization_id uuid,
  allowed_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from app.organization_memberships membership
      where membership.organization_id = target_organization_id
        and membership.user_id = (select auth.uid())
        and membership.status = 'active'
        and membership.role::text = any (allowed_roles)
    );
$$;

create or replace function private.can_view_org(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.is_hoc_staff())
    or (select private.has_org_role(
      target_organization_id,
      array['owner', 'dispatcher', 'driver']
    ));
$$;

revoke all on schema private from public;
revoke all on all functions in schema private from public;
grant usage on schema private to authenticated;
grant execute on function private.is_hoc_staff() to authenticated;
grant execute on function private.has_org_role(uuid, text[]) to authenticated;
grant execute on function private.can_view_org(uuid) to authenticated;
