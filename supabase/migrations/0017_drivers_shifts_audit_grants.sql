-- Hand-authored, mirroring 0005_app_schema_grants.sql / 0010_orders_payments_grants.sql
-- / 0014_vehicles_grants.sql. Schema-level `grant usage on schema app to
-- authenticated` was already applied in 0005 - only these three new
-- tables need their own grants. RLS is what actually restricts writes to
-- managers/staff (drivers, shifts) or to the acting user (audit_logs);
-- the grant layer stays broad, matching every prior milestone's pattern.

grant select, insert, update on app.drivers to authenticated;
grant select, insert, update on app.shifts to authenticated;
-- No update/delete grant on audit_logs at all - append-only.
grant select, insert on app.audit_logs to authenticated;
