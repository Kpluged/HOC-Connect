-- Milestone 9b: the driver side of dispatch.
--  * Realtime broadcast auth for the driver/trip topics (architecture doc §8).
--  * Offer -> accept/decline lifecycle + a driver self-service location report.
--  * An automated nearest-driver matching worker on pg_cron.
-- Follows the M9a SECURITY DEFINER + validate + event + audit + broadcast shape
-- (0021). accept_offer locks the driver row and rejects a driver already on an
-- active trip, closing the M9a double-assignment race.

-- --- Realtime broadcast policies (realtime.messages only; realtime schema is locked) ---
CREATE POLICY "drivers broadcast own location"
ON realtime.messages FOR INSERT TO authenticated
WITH CHECK (
  realtime.messages.extension = 'broadcast'
  and realtime.topic() = 'driver:' || (select auth.uid())::text || ':location'
);
--> statement-breakpoint
CREATE POLICY "managers and the driver read driver location"
ON realtime.messages FOR SELECT TO authenticated
USING (
  realtime.messages.extension = 'broadcast'
  and exists (
    select 1 from app.drivers d
    where realtime.topic() = 'driver:' || d.profile_id::text || ':location'
      and (
        (select private.is_hoc_staff())
        or (select private.has_org_role(d.organization_id, array['owner','dispatcher']::text[]))
        or d.profile_id = (select auth.uid())
      )
  )
);
--> statement-breakpoint
CREATE POLICY "drivers read own offers"
ON realtime.messages FOR SELECT TO authenticated
USING (
  realtime.messages.extension = 'broadcast'
  and realtime.topic() = 'driver:' || (select auth.uid())::text || ':offers'
);
--> statement-breakpoint
CREATE POLICY "trip participants read trip broadcasts"
ON realtime.messages FOR SELECT TO authenticated
USING (
  realtime.messages.extension = 'broadcast'
  and exists (
    select 1 from app.trips t
    where realtime.topic() = 'trip:' || t.id::text
      and (
        (select private.is_hoc_staff())
        or (select private.has_org_role(t.organization_id, array['owner','dispatcher']::text[]))
        or exists (select 1 from app.drivers d where d.id = t.driver_id and d.profile_id = (select auth.uid()))
      )
  )
);
--> statement-breakpoint

-- --- A driver reports their own location + availability (own row only). ---
CREATE OR REPLACE FUNCTION app.driver_report_location(
  p_lat double precision, p_lng double precision, p_status text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
declare
  v_actor uuid := (select auth.uid());
  v_driver app.drivers;
begin
  if v_actor is null then raise exception 'authentication required' using errcode = '28000'; end if;
  select * into v_driver from app.drivers where profile_id = v_actor limit 1;
  if not found then raise exception 'no driver profile for this user' using errcode = 'P0002'; end if;

  update app.drivers set
    current_location = gis.st_setsrid(gis.st_makepoint(p_lng, p_lat), 4326)::gis.geography,
    operational_status = coalesce(p_status::app.driver_operational_status, operational_status),
    last_seen_at = now(),
    updated_at = now()
  where id = v_driver.id;

  -- Move the driver on the owner's dispatch board (rides the existing channel).
  perform app.broadcast_dispatch(v_driver.organization_id, 'driver.location', null, null);
  begin
    perform realtime.send(
      jsonb_build_object('driverId', v_driver.id, 'lat', p_lat, 'lng', p_lng),
      'location', 'driver:' || v_actor::text || ':location', true);
  exception when others then null; end;
end;
$$;
--> statement-breakpoint

-- --- Driver accepts an offer: offered -> assigned, using their shift's vehicle. ---
CREATE OR REPLACE FUNCTION app.accept_offer(p_trip_id uuid) RETURNS app.trips
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
declare
  v_actor uuid := (select auth.uid());
  v_trip app.trips;
  v_driver app.drivers;
  v_vehicle uuid;
begin
  select * into v_trip from app.trips where id = p_trip_id for update;
  if not found then raise exception 'trip not found' using errcode = 'P0002'; end if;
  if v_trip.status <> 'offered' then raise exception 'trip is not offered' using errcode = '22023'; end if;

  -- Lock the offered driver row; the caller must be that driver.
  select * into v_driver from app.drivers where id = v_trip.driver_id for update;
  if not found or v_driver.profile_id is distinct from v_actor then
    raise exception 'not authorized to accept this offer' using errcode = '42501';
  end if;

  -- Reject if the driver is already committed to another active trip (race guard).
  if exists (
    select 1 from app.trips t2
    where t2.driver_id = v_driver.id and t2.id <> p_trip_id
      and t2.status in ('assigned','driver_en_route','driver_arrived','in_progress')
  ) then
    raise exception 'driver already on an active trip' using errcode = '22023';
  end if;

  select vehicle_id into v_vehicle from app.shifts
    where driver_id = v_driver.id and ended_at is null limit 1;
  if v_vehicle is null then
    raise exception 'driver has no active vehicle assignment' using errcode = '22023';
  end if;

  update app.trips
    set status = 'assigned', vehicle_id = v_vehicle, assigned_at = now(), updated_at = now()
    where id = p_trip_id
    returning * into v_trip;
  update app.drivers set operational_status = 'on_trip', updated_at = now() where id = v_driver.id;

  insert into app.trip_events (organization_id, trip_id, event_type, from_status, to_status, actor_user_id, payload)
  values (v_trip.organization_id, p_trip_id, 'accepted', 'offered', 'assigned', v_actor,
          jsonb_build_object('driverId', v_driver.id, 'vehicleId', v_vehicle));
  insert into app.audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, after_data)
  values (v_trip.organization_id, v_actor, 'trip.accept', 'trip', p_trip_id,
          jsonb_build_object('status', 'assigned', 'driverId', v_driver.id, 'vehicleId', v_vehicle));
  perform app.broadcast_dispatch(v_trip.organization_id, 'trip.assigned', p_trip_id, 'assigned');
  return v_trip;
end;
$$;
--> statement-breakpoint

-- --- Driver declines an offer: offered -> requested (re-queued for matching). ---
CREATE OR REPLACE FUNCTION app.decline_offer(p_trip_id uuid) RETURNS app.trips
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
declare
  v_actor uuid := (select auth.uid());
  v_trip app.trips;
  v_driver app.drivers;
begin
  select * into v_trip from app.trips where id = p_trip_id for update;
  if not found then raise exception 'trip not found' using errcode = 'P0002'; end if;
  if v_trip.status <> 'offered' then raise exception 'trip is not offered' using errcode = '22023'; end if;
  select * into v_driver from app.drivers where id = v_trip.driver_id;
  if not found or v_driver.profile_id is distinct from v_actor then
    raise exception 'not authorized to decline this offer' using errcode = '42501';
  end if;

  update app.trips set status = 'requested', driver_id = null, updated_at = now()
    where id = p_trip_id returning * into v_trip;
  insert into app.trip_events (organization_id, trip_id, event_type, from_status, to_status, actor_user_id, payload)
  values (v_trip.organization_id, p_trip_id, 'declined', 'offered', 'requested', v_actor,
          jsonb_build_object('driverId', v_driver.id));
  perform app.broadcast_dispatch(v_trip.organization_id, 'trip.requested', p_trip_id, 'requested');
  return v_trip;
end;
$$;
--> statement-breakpoint

-- --- Automated matching: offer each stale requested trip to the nearest
-- available driver who is on an active shift and free. Service/cron only. ---
CREATE OR REPLACE FUNCTION app.run_dispatch_matching() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
declare
  v_trip record;
  v_driver record;
  v_offered integer := 0;
begin
  for v_trip in
    select id, organization_id, pickup
    from app.trips
    where status = 'requested' and driver_id is null
      and requested_at < now() - interval '25 seconds'
    order by requested_at asc
    limit 20
  loop
    select d.id, d.profile_id into v_driver
    from app.drivers d
    where d.organization_id = v_trip.organization_id
      and d.operational_status = 'available'
      and d.current_location is not null
      and exists (select 1 from app.shifts s where s.driver_id = d.id and s.ended_at is null)
      and not exists (
        select 1 from app.trips t2
        where t2.driver_id = d.id
          and t2.status in ('offered','assigned','driver_en_route','driver_arrived','in_progress')
      )
    order by d.current_location operator(gis.<->) v_trip.pickup
    limit 1;

    if found then
      update app.trips set status = 'offered', driver_id = v_driver.id, updated_at = now()
        where id = v_trip.id and status = 'requested';
      insert into app.trip_events (organization_id, trip_id, event_type, from_status, to_status, payload)
      values (v_trip.organization_id, v_trip.id, 'offered', 'requested', 'offered',
              jsonb_build_object('driverId', v_driver.id, 'auto', true));
      if v_driver.profile_id is not null then
        begin
          perform realtime.send(
            jsonb_build_object('tripId', v_trip.id, 'event', 'offer'),
            'offer', 'driver:' || v_driver.profile_id::text || ':offers', true);
        exception when others then null; end;
      end if;
      perform app.broadcast_dispatch(v_trip.organization_id, 'trip.offered', v_trip.id, 'offered');
      v_offered := v_offered + 1;
    end if;
  end loop;
  return v_offered;
end;
$$;
--> statement-breakpoint

-- Grants: driver-facing functions to authenticated; matching stays service-only.
grant execute on function app.driver_report_location(double precision, double precision, text) to authenticated;
--> statement-breakpoint
grant execute on function app.accept_offer(uuid) to authenticated;
--> statement-breakpoint
grant execute on function app.decline_offer(uuid) to authenticated;
--> statement-breakpoint
revoke all on function app.run_dispatch_matching() from public;
