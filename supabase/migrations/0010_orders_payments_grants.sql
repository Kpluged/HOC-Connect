-- Hand-authored, mirroring 0005_app_schema_grants.sql. Schema-level
-- `grant usage on schema app to authenticated` was already applied in 0005
-- and doesn't need repeating - only these two new tables need their own
-- grants. RLS controls row visibility, but the role still needs baseline
-- table privileges before Postgres attempts a query.

grant select, insert, update on app.orders to authenticated;
-- Deliberately no update/delete grant on app.payments - status only ever
-- changes via the webhook's own DATABASE_URL connection, which runs as
-- `postgres` (rolbypassrls, and bypasses grants too via object ownership),
-- never via the `authenticated` role at all.
grant select, insert on app.payments to authenticated;
