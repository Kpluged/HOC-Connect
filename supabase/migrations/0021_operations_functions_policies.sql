-- Milestone 9: RLS SELECT policies for the operations tables (drizzle-
-- generated) + the trip-lifecycle SECURITY DEFINER functions. trips/trip_events
-- have NO insert/update policy - the functions below are the only write path,
-- so authenticated callers get no direct column-level write access to trips
-- (architecture doc §9 invariant 6). Each function validates tenant + actor +
-- legal state edge + eligibility, appends a trip_events row and an audit_logs
-- row, and broadcasts on org:<id>:dispatch, all in one transaction.

-- --- RLS policies (generated) ---
CREATE POLICY "tenant and staff can select charging sessions" ON "app"."charging_sessions" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select private.can_view_org("app"."charging_sessions"."organization_id")));--> statement-breakpoint
CREATE POLICY "managers and staff can insert charging sessions" ON "app"."charging_sessions" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((select private.is_hoc_staff()) or (select private.has_org_role("app"."charging_sessions"."organization_id", array['owner','dispatcher']::text[]))));--> statement-breakpoint
CREATE POLICY "managers and staff can update charging sessions" ON "app"."charging_sessions" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (((select private.is_hoc_staff()) or (select private.has_org_role("app"."charging_sessions"."organization_id", array['owner','dispatcher']::text[])))) WITH CHECK (((select private.is_hoc_staff()) or (select private.has_org_role("app"."charging_sessions"."organization_id", array['owner','dispatcher']::text[]))));--> statement-breakpoint
CREATE POLICY "tenant and staff can select maintenance tickets" ON "app"."maintenance_tickets" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select private.can_view_org("app"."maintenance_tickets"."organization_id")));--> statement-breakpoint
CREATE POLICY "managers and staff can insert maintenance tickets" ON "app"."maintenance_tickets" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((select private.is_hoc_staff()) or (select private.has_org_role("app"."maintenance_tickets"."organization_id", array['owner','dispatcher']::text[]))));--> statement-breakpoint
CREATE POLICY "managers and staff can update maintenance tickets" ON "app"."maintenance_tickets" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (((select private.is_hoc_staff()) or (select private.has_org_role("app"."maintenance_tickets"."organization_id", array['owner','dispatcher']::text[])))) WITH CHECK (((select private.is_hoc_staff()) or (select private.has_org_role("app"."maintenance_tickets"."organization_id", array['owner','dispatcher']::text[]))));--> statement-breakpoint
CREATE POLICY "managers, staff, and the assigned driver can select trip events" ON "app"."trip_events" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((select private.is_hoc_staff()) or (select private.has_org_role("app"."trip_events"."organization_id", array['owner','dispatcher']::text[]))) or exists (
            select 1 from "app"."trips" t
            join "app"."drivers" d on d.id = t.driver_id
            where t.id = "app"."trip_events"."trip_id" and d.profile_id = (select auth.uid())
          ));--> statement-breakpoint
CREATE POLICY "managers, staff, and the assigned driver can select trips" ON "app"."trips" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((select private.is_hoc_staff()) or (select private.has_org_role("app"."trips"."organization_id", array['owner','dispatcher']::text[]))) or exists (
          select 1 from "app"."drivers" d
          where d.id = "app"."trips"."driver_id" and d.profile_id = (select auth.uid())
        ));--> statement-breakpoint
CREATE POLICY "tenant and staff can select telemetry" ON "app"."vehicle_telemetry_snapshots" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select private.can_view_org("app"."vehicle_telemetry_snapshots"."organization_id")));--> statement-breakpoint
CREATE POLICY "staff can insert telemetry" ON "app"."vehicle_telemetry_snapshots" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select private.is_hoc_staff()));--> statement-breakpoint
CREATE POLICY "staff can update telemetry" ON "app"."vehicle_telemetry_snapshots" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select private.is_hoc_staff())) WITH CHECK ((select private.is_hoc_staff()));--> statement-breakpoint

-- --- Broadcast helper: best-effort private Realtime broadcast on the org
-- dispatch topic. A realtime hiccup must never roll back a committed
-- lifecycle write, so failures are swallowed. ---
CREATE OR REPLACE FUNCTION app.broadcast_dispatch(
  p_organization_id uuid, p_event text, p_trip_id uuid, p_status text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
begin
  begin
    perform realtime.send(
      jsonb_build_object('tripId', p_trip_id, 'status', p_status, 'event', p_event),
      p_event,
      'org:' || p_organization_id::text || ':dispatch',
      true
    );
  exception when others then
    null;
  end;
end;
$$;
--> statement-breakpoint

-- --- Create a manual ride in `requested` state. ---
CREATE OR REPLACE FUNCTION app.create_trip(
  p_organization_id uuid,
  p_pickup_label text,
  p_pickup_lng double precision,
  p_pickup_lat double precision,
  p_dropoff_label text,
  p_dropoff_lng double precision,
  p_dropoff_lat double precision,
  p_source text DEFAULT 'manual'
) RETURNS app.trips
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
declare
  v_actor uuid := (select auth.uid());
  v_trip app.trips;
begin
  if v_actor is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  if not (
    (select private.is_hoc_staff())
    or (select private.has_org_role(p_organization_id, array['owner','dispatcher']::text[]))
  ) then
    raise exception 'not authorized to create trips for this organization' using errcode = '42501';
  end if;

  insert into app.trips (
    organization_id, source, pickup_label, pickup, dropoff_label, dropoff,
    status, created_by_user_id
  ) values (
    p_organization_id,
    coalesce(p_source, 'manual')::app.trip_source,
    p_pickup_label,
    gis.st_setsrid(gis.st_makepoint(p_pickup_lng, p_pickup_lat), 4326)::gis.geography,
    p_dropoff_label,
    gis.st_setsrid(gis.st_makepoint(p_dropoff_lng, p_dropoff_lat), 4326)::gis.geography,
    'requested',
    v_actor
  ) returning * into v_trip;

  insert into app.trip_events (organization_id, trip_id, event_type, to_status, actor_user_id, payload)
  values (p_organization_id, v_trip.id, 'created', 'requested', v_actor,
          jsonb_build_object('pickupLabel', p_pickup_label, 'dropoffLabel', p_dropoff_label));

  insert into app.audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, after_data)
  values (p_organization_id, v_actor, 'trip.create', 'trip', v_trip.id,
          jsonb_build_object('status', 'requested', 'source', v_trip.source,
                             'pickupLabel', p_pickup_label, 'dropoffLabel', p_dropoff_label));

  perform app.broadcast_dispatch(p_organization_id, 'trip.created', v_trip.id, 'requested');
  return v_trip;
end;
$$;
--> statement-breakpoint

-- --- Assign a driver + vehicle, moving requested/offered -> assigned. ---
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
  if not exists (
    select 1 from app.drivers d where d.id = p_driver_id and d.organization_id = v_org
  ) then
    raise exception 'driver does not belong to this organization' using errcode = '22023';
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

-- --- Advance a ride through the legal lifecycle graph. Allowed to managers/
-- staff or the assigned driver (the driver path is exercised by the app in
-- M9b). ---
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

  -- Free the driver once the ride ends, and count a completed ride against
  -- the driver's active shift (best-effort - a no-op if no shift is open).
  if p_next in ('completed', 'cancelled') and v_trip.driver_id is not null then
    update app.drivers set operational_status = 'available', updated_at = now()
      where id = v_trip.driver_id;
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
