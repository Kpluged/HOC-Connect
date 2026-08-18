-- Milestone 9 hardening, addressing a CodeRabbit review pass.
--
-- 1. Least-privilege EXECUTE (was implicitly PUBLIC): the lifecycle functions
--    keep only their explicit `authenticated` grant (from 0022); the internal
--    broadcast helper becomes owner-only (the SECURITY DEFINER lifecycle
--    functions still call it as owner).
-- 2. Defense-in-depth on charging/maintenance INSERT: the referenced vehicle
--    must belong to the same organization (mirrors the shifts/vehicles EXISTS
--    pattern from M7/M8) - closes the "checked WHO but not WHAT" gap class.
-- 3. assign_trip now locks the driver row and refuses a driver already on an
--    active trip, preventing a double-assignment race.
-- 4. transition_trip only frees a driver whose status is actually on_trip.

revoke execute on function app.broadcast_dispatch(uuid, text, uuid, text) from public;
--> statement-breakpoint
revoke execute on function app.create_trip(uuid, text, double precision, double precision, text, double precision, double precision, text) from public;
--> statement-breakpoint
revoke execute on function app.assign_trip(uuid, uuid, uuid) from public;
--> statement-breakpoint
revoke execute on function app.transition_trip(uuid, app.trip_status) from public;
--> statement-breakpoint

ALTER POLICY "managers and staff can insert charging sessions" ON "app"."charging_sessions"
  WITH CHECK (
    ((select private.is_hoc_staff()) or (select private.has_org_role("app"."charging_sessions"."organization_id", array['owner','dispatcher']::text[])))
    and exists (
      select 1 from "app"."vehicles" v
      where v.id = "app"."charging_sessions"."vehicle_id"
        and v.organization_id = "app"."charging_sessions"."organization_id"
    )
  );
--> statement-breakpoint
ALTER POLICY "managers and staff can insert maintenance tickets" ON "app"."maintenance_tickets"
  WITH CHECK (
    ((select private.is_hoc_staff()) or (select private.has_org_role("app"."maintenance_tickets"."organization_id", array['owner','dispatcher']::text[])))
    and exists (
      select 1 from "app"."vehicles" v
      where v.id = "app"."maintenance_tickets"."vehicle_id"
        and v.organization_id = "app"."maintenance_tickets"."organization_id"
    )
  );
--> statement-breakpoint

CREATE OR REPLACE FUNCTION app.assign_trip(
  p_trip_id uuid, p_driver_id uuid, p_vehicle_id uuid
) RETURNS app.trips
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
declare
  v_actor uuid := (select auth.uid());
  v_trip app.trips;
  v_org uuid;
  v_prev app.trip_status;
begin
  select * into v_trip from app.trips where id = p_trip_id for update;
  if not found then raise exception 'trip not found' using errcode = 'P0002'; end if;
  v_org := v_trip.organization_id;
  v_prev := v_trip.status;

  if not (
    (select private.is_hoc_staff())
    or (select private.has_org_role(v_org, array['owner','dispatcher']::text[]))
  ) then
    raise exception 'not authorized to assign this trip' using errcode = '42501';
  end if;
  if v_prev not in ('requested', 'offered') then
    raise exception 'trip cannot be assigned from status %', v_prev using errcode = '22023';
  end if;

  -- Lock the driver row so concurrent assignments to the same driver serialize,
  -- then refuse a driver who is already on an active trip.
  perform 1 from app.drivers d
    where d.id = p_driver_id and d.organization_id = v_org for update;
  if not found then
    raise exception 'driver does not belong to this organization' using errcode = '22023';
  end if;
  if exists (
    select 1 from app.trips t
    where t.driver_id = p_driver_id
      and t.status in ('assigned', 'driver_en_route', 'driver_arrived', 'in_progress')
  ) then
    raise exception 'driver is already on an active trip' using errcode = '22023';
  end if;

  if not exists (
    select 1 from app.vehicles v
    where v.id = p_vehicle_id and v.organization_id = v_org and v.status in ('delivered', 'active')
  ) then
    raise exception 'vehicle is not eligible (must be delivered or active in this organization)' using errcode = '22023';
  end if;

  update app.trips
    set driver_id = p_driver_id, vehicle_id = p_vehicle_id,
        status = 'assigned', assigned_at = now(), updated_at = now()
    where id = p_trip_id
    returning * into v_trip;

  update app.drivers set operational_status = 'on_trip', updated_at = now() where id = p_driver_id;

  insert into app.trip_events (organization_id, trip_id, event_type, from_status, to_status, actor_user_id, payload)
  values (v_org, p_trip_id, 'assigned', v_prev, 'assigned', v_actor,
          jsonb_build_object('driverId', p_driver_id, 'vehicleId', p_vehicle_id));

  insert into app.audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, after_data)
  values (v_org, v_actor, 'trip.assign', 'trip', p_trip_id,
          jsonb_build_object('driverId', p_driver_id, 'vehicleId', p_vehicle_id, 'status', 'assigned'));

  perform app.broadcast_dispatch(v_org, 'trip.assigned', p_trip_id, 'assigned');
  return v_trip;
end;
$$;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION app.transition_trip(
  p_trip_id uuid, p_next app.trip_status
) RETURNS app.trips
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
declare
  v_actor uuid := (select auth.uid());
  v_trip app.trips;
  v_org uuid;
  v_prev app.trip_status;
  v_ok boolean;
begin
  select * into v_trip from app.trips where id = p_trip_id for update;
  if not found then raise exception 'trip not found' using errcode = 'P0002'; end if;
  v_org := v_trip.organization_id;
  v_prev := v_trip.status;

  if not (
    (select private.is_hoc_staff())
    or (select private.has_org_role(v_org, array['owner','dispatcher']::text[]))
    or exists (
      select 1 from app.drivers d
      where d.id = v_trip.driver_id and d.profile_id = v_actor
    )
  ) then
    raise exception 'not authorized to transition this trip' using errcode = '42501';
  end if;

  v_ok := case
    when v_prev = 'requested'       and p_next = 'cancelled' then true
    when v_prev = 'offered'         and p_next = 'cancelled' then true
    when v_prev = 'assigned'        and p_next in ('driver_en_route', 'cancelled') then true
    when v_prev = 'driver_en_route' and p_next in ('driver_arrived', 'cancelled') then true
    when v_prev = 'driver_arrived'  and p_next in ('in_progress', 'cancelled') then true
    when v_prev = 'in_progress'     and p_next = 'completed' then true
    else false
  end;
  if not v_ok then
    raise exception 'illegal trip transition % -> %', v_prev, p_next using errcode = '22023';
  end if;

  update app.trips
    set status = p_next,
        started_at   = case when p_next = 'in_progress' then now() else started_at end,
        completed_at = case when p_next = 'completed'   then now() else completed_at end,
        cancelled_at = case when p_next = 'cancelled'   then now() else cancelled_at end,
        updated_at = now()
    where id = p_trip_id
    returning * into v_trip;

  -- Free the driver only if they were actually on this trip, and count a
  -- completed ride against their active shift (no-op if no shift is open).
  if p_next in ('completed', 'cancelled') and v_trip.driver_id is not null then
    update app.drivers set operational_status = 'available', updated_at = now()
      where id = v_trip.driver_id and operational_status = 'on_trip';
  end if;
  if p_next = 'completed' and v_trip.driver_id is not null then
    update app.shifts set trip_count = trip_count + 1, updated_at = now()
      where driver_id = v_trip.driver_id and ended_at is null;
  end if;

  insert into app.trip_events (organization_id, trip_id, event_type, from_status, to_status, actor_user_id)
  values (v_org, p_trip_id, 'status_change', v_prev, p_next, v_actor);

  insert into app.audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, before_data, after_data)
  values (v_org, v_actor, 'trip.transition', 'trip', p_trip_id,
          jsonb_build_object('status', v_prev), jsonb_build_object('status', p_next));

  perform app.broadcast_dispatch(v_org, 'trip.' || p_next::text, p_trip_id, p_next::text);
  return v_trip;
end;
$$;
