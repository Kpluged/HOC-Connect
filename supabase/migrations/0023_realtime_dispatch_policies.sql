-- Milestone 9: private Realtime Broadcast authorization
-- (docs/HOC-Connect-architecture-and-schema.md §8). Policy on the locked
-- realtime.messages table only - no structural change to the realtime schema.
--
-- Scope this pass: the org:<id>:dispatch RECEIVE policy, the only topic the
-- web dispatch board subscribes to and the only one exercisable without the
-- driver app. Broadcasts are SENT server-side by app.broadcast_dispatch()
-- (realtime.send runs as definer, bypassing RLS), so no client INSERT policy
-- is needed. The trip:<id> / driver:<profile>:{location,offers} topics and
-- their policies are deferred to M9b alongside the driver app that uses them.
--
-- Only same-organization owners/dispatchers and HOC staff may receive a
-- tenant's dispatch broadcasts; drivers never subscribe to this topic.
CREATE POLICY "managers and staff receive org dispatch broadcasts"
ON realtime.messages
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  realtime.messages.extension = 'broadcast'
  and (
    (select private.is_hoc_staff())
    or exists (
      select 1
      from app.organization_memberships m
      where m.user_id = (select auth.uid())
        and m.status = 'active'
        and m.role in ('owner', 'dispatcher')
        and realtime.topic() = 'org:' || m.organization_id::text || ':dispatch'
    )
  )
);
