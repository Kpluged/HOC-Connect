-- Hand-authored (Drizzle can't diff CREATE FUNCTION/TABLE-in-private-schema).
-- Postgres-backed fixed-window rate limiter, not a new Redis vendor -
-- Vercel functions are stateless across instances, but Postgres is
-- already the shared, consistent datastore every request already talks
-- to. `private.rate_limits` is never granted to `authenticated` directly
-- - the only entry point is the SECURITY DEFINER function below, same
-- pattern as private.is_hoc_staff()/has_org_role() in
-- 0001_private_rls_helpers.sql.

create table private.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  attempt_count integer not null default 1
);

-- Atomic upsert-based fixed window: if the existing window has expired,
-- reset to a fresh window with count 1; otherwise increment. Single
-- statement avoids a separate select-then-update race between concurrent
-- requests for the same key.
create or replace function private.check_rate_limit(
  p_key text,
  p_max_attempts integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  insert into private.rate_limits (key, window_start, attempt_count)
  values (p_key, now(), 1)
  on conflict (key) do update set
    window_start = case
      when private.rate_limits.window_start <= now() - make_interval(secs => p_window_seconds)
        then now()
      else private.rate_limits.window_start
    end,
    attempt_count = case
      when private.rate_limits.window_start <= now() - make_interval(secs => p_window_seconds)
        then 1
      else private.rate_limits.attempt_count + 1
    end
  returning attempt_count into v_count;

  return v_count <= p_max_attempts;
end;
$$;

revoke all on private.rate_limits from public;
revoke all on private.rate_limits from authenticated;
revoke all on function private.check_rate_limit(text, integer, integer) from public;
grant execute on function private.check_rate_limit(text, integer, integer) to authenticated;
