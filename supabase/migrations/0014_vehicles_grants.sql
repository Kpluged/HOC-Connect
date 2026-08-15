-- Hand-authored, mirroring 0005_app_schema_grants.sql /
-- 0010_orders_payments_grants.sql. Schema-level `grant usage on schema app
-- to authenticated` was already applied in 0005 and doesn't need
-- repeating - only this new table needs its own grants. Unlike payments,
-- there's no automated-actor-only status transition here (no webhook) -
-- staff perform every write directly, so update is granted alongside
-- select/insert.

grant select, insert, update on app.vehicles to authenticated;
