-- Milestone 9: enable PostGIS into a dedicated `gis` schema (never `public`,
-- never a pinned version - Supabase deprecated extension version pinning).
-- See docs/HOC-Connect-architecture-and-schema.md sections 6 and 12.
-- Must run before 0020, which declares gis.geography(Point,4326) columns.
create schema if not exists gis;
--> statement-breakpoint
create extension if not exists postgis with schema gis;
--> statement-breakpoint
-- authenticated needs to resolve the gis-schema geography/geometry types and
-- operators used by the trips/telemetry read queries and lifecycle functions.
grant usage on schema gis to authenticated, anon, service_role;
