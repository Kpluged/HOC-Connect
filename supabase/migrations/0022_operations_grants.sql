-- Hand-authored, mirroring 0017_drivers_shifts_audit_grants.sql. Schema usage
-- on `app` was granted in 0005. RLS is what restricts access; grants stay
-- least-privilege by table:
--   trips / trip_events : SELECT only. All writes go through the SECURITY
--     DEFINER lifecycle functions (which run as owner), so authenticated is
--     never granted INSERT/UPDATE on these - reinforcing "no direct client
--     column-level write access to trips" at the privilege layer too.
--   telemetry           : SELECT + INSERT + UPDATE (RLS restricts writes to staff).
--   charging/maintenance: SELECT + INSERT + UPDATE (RLS restricts writes to managers).

grant select on app.trips to authenticated;
--> statement-breakpoint
grant select on app.trip_events to authenticated;
--> statement-breakpoint
grant select, insert, update on app.vehicle_telemetry_snapshots to authenticated;
--> statement-breakpoint
grant select, insert, update on app.charging_sessions to authenticated;
--> statement-breakpoint
grant select, insert, update on app.maintenance_tickets to authenticated;
--> statement-breakpoint

-- The trip lifecycle functions are the only write path into trips/trip_events.
grant execute on function app.create_trip(uuid, text, double precision, double precision, text, double precision, double precision, text) to authenticated;
--> statement-breakpoint
grant execute on function app.assign_trip(uuid, uuid, uuid) to authenticated;
--> statement-breakpoint
grant execute on function app.transition_trip(uuid, app.trip_status) to authenticated;
