-- Milestone 9b: smooth live movement on the owner's dispatch map.
-- driver_report_location previously fired a coordinate-less 'driver.location'
-- event, forcing the board to re-fetch the whole tree on every ping. Carry the
-- driver id + coordinates + status in the payload so the board can patch just
-- that one marker in place. Still best-effort: a realtime hiccup must never roll
-- back the committed location write.
CREATE OR REPLACE FUNCTION app.driver_report_location(
  p_lat double precision, p_lng double precision, p_status text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
declare
  v_actor uuid := (select auth.uid());
  v_driver app.drivers;
  v_status app.driver_operational_status;
begin
  if v_actor is null then raise exception 'authentication required' using errcode = '28000'; end if;
  select * into v_driver from app.drivers where profile_id = v_actor limit 1;
  if not found then raise exception 'no driver profile for this user' using errcode = 'P0002'; end if;

  v_status := coalesce(p_status::app.driver_operational_status, v_driver.operational_status);

  update app.drivers set
    current_location = gis.st_setsrid(gis.st_makepoint(p_lng, p_lat), 4326)::gis.geography,
    operational_status = v_status,
    last_seen_at = now(),
    updated_at = now()
  where id = v_driver.id;

  -- Move the driver on the owner's dispatch board (rides the existing channel),
  -- carrying coordinates so the board patches this marker without a full refetch.
  begin
    perform realtime.send(
      jsonb_build_object(
        'event', 'driver.location', 'driverId', v_driver.id,
        'lat', p_lat, 'lng', p_lng, 'operationalStatus', v_status::text),
      'driver.location',
      'org:' || v_driver.organization_id::text || ':dispatch',
      true);
  exception when others then null; end;

  -- The driver's own location topic (native trip screens subscribe to this).
  begin
    perform realtime.send(
      jsonb_build_object('driverId', v_driver.id, 'lat', p_lat, 'lng', p_lng),
      'location', 'driver:' || v_actor::text || ':location', true);
  exception when others then null; end;
end;
$$;
--> statement-breakpoint
grant execute on function app.driver_report_location(double precision, double precision, text) to authenticated;
