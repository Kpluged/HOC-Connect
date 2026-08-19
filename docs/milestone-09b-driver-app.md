# Milestone 09b — The driver app, live location, offers & monitoring

Status: complete (code + server verified). Native-only behaviour (background
GPS, the `@rnmapbox/maps` view) is built and bundles cleanly but needs a device
dev-build to exercise — see "Follow-up for the operator".

M9a shipped the web/owner half of dispatch. M9b builds **the driver's phone**
and the server seams that close the loop: a driver signs in, goes online, is
offered the nearest requested ride by an automated matcher, accepts, drives it
to completion, and the owner watches them move **live** on the dispatch map,
with errors captured in Sentry.

## Included

- **Bearer auth for `/api/trpc`** (`apps/web/src/server/trpc/context.ts`): when
  an `Authorization: Bearer <jwt>` header is present the context resolves claims
  via `supabase.auth.getClaims(token)`, else the cookie path. `protectedProcedure`
  / RLS are unchanged (identical claims shape), so the native app calls the
  existing routers. Verified in production: `drivers.me` without a token →
  clean `UNAUTHORIZED` (401).
- **Offer / accept / decline lifecycle + self-service location** (migration
  `0026`, following the M9a SECURITY DEFINER + validate + event + audit +
  broadcast shape):
  - `app.accept_offer` (offered→assigned) **locks the offered driver row** and
    rejects a driver already on another active trip — closing the M9a
    double-assignment race — then resolves the vehicle from the active shift.
  - `app.decline_offer` (offered→requested, driver cleared, re-queued).
  - `app.driver_report_location(lat,lng,status)` updates the caller's own
    `drivers` row (`profile_id = auth.uid()`) and broadcasts.
  - `app.run_dispatch_matching()` offers each stale `requested` trip to the
    nearest available on-shift, uncommitted driver (§6 `<->` KNN); service-only.
  - Realtime `realtime.messages` policies for the `driver:<profile>:location`,
    `driver:<profile>:offers`, and `trip:<id>` topics (architecture §8).
- **pg_cron matcher** (migration `0027`): `hoc-dispatch-matching` runs
  `run_dispatch_matching()` every 20 seconds.
- **Smooth live map movement** (migration `0028`): `driver_report_location`'s
  dispatch broadcast now carries `driverId + lat/lng + status`, so the web board
  patches that one marker in place instead of refetching; other dispatch events
  still `router.refresh()`.
- **The Expo driver app** (`apps/driver`, full native):
  - Supabase auth with platform-aware session storage; a bearer tRPC-over-HTTP
    client (`src/lib/trpc.ts`); route-gated `(auth)/sign-in` → `(driver)`.
  - **Location streaming** (`src/lib/location.ts`): `expo-location` foreground
    watch + an `expo-task-manager` background task (native only; web skips it),
    both reporting through `drivers.reportLocation`. An online/offline toggle
    flips the driver into/out of the matching pool; streaming resumes on reopen.
  - **Ride offers** (`src/lib/realtime.ts` + the home screen): a subscription to
    `driver:<uid>:offers` surfaces an offered trip as a Guards-Red Accept /
    Decline card.
  - **Trip screen** (`(driver)/trip/[tripId]`): a monochrome Mapbox map
    (`@rnmapbox/maps`, matching the owner map) with pickup / drop-off / live
    driver pins, and a single forward CTA advancing status via `trips.transition`
    (assigned → en route → arrived → in progress → completed).
  - Monochrome + Guards-Red throughout, on `@hoc/design-tokens`.
- **Sentry** (M9b Stage 6): `@sentry/nextjs` on web (`instrumentation*.ts` +
  `withSentryConfig`, source-map upload gated on `SENTRY_AUTH_TOKEN`);
  `@sentry/react-native` in the driver app (`Sentry.init` + `Sentry.wrap`, Expo
  config plugin gated on `SENTRY_ORG`/`SENTRY_PROJECT`). DSNs come from env
  (client-safe, never committed); disabled when absent.

## Platform-split map (keeps the web bundle clean)

`@rnmapbox/maps` has no web renderer, so `TripMap` is split: `trip-map.native.tsx`
(Mapbox) and a `trip-map.tsx` fallback panel. Metro resolves the native file on
device and the base file on web, so the heavy native dependency never enters the
web bundle — verified: Expo web bundles at 1372 modules with no `@rnmapbox`
resolution. The Mapbox **download** token (secret, native build only) is injected
by a new dynamic `app.config.ts` from `MAPBOX_DOWNLOAD_TOKEN`; the public `pk.*`
runtime token draws tiles.

## Dependency dedupe note

`@sentry/nextjs` pulls in `@opentelemetry/api`, an *optional peer* of
`drizzle-orm`. That split drizzle into two peer-variant instances whose types are
nominally incompatible (`shouldInlineParams` private field), breaking the web
typecheck. Fixed by adding `@opentelemetry/api` to `@hoc/db` and `@hoc/web` so
both resolve the same instance.

## Verification

- Migrations `0026`–`0028` applied to the live project via the account-scoped
  connector; `get_advisors(security)` clean (baseline leaked-password WARN only).
- **Matcher + offer lifecycle** (RLS impersonation, rolled back, same
  methodology as M5–M8): a stale `requested` trip → `run_dispatch_matching`
  offers it to the nearest available on-shift driver → `accept_offer` →
  `assigned` with the shift's vehicle + driver `on_trip`. A different user is
  blocked (`not authorized`); `decline_offer` re-queues to `requested` with the
  driver cleared; accepting a non-offered trip is blocked. No demo data left
  mutated. `hoc-dispatch-matching` cron confirmed active (every 20s).
- **Bearer auth** verified in production (401 without a token).
- `typecheck` + `lint` green for both `@hoc/web` and `@hoc/driver`; `next build`
  passes with Sentry engaged.
- **Driver app on Expo web** (the only headless surface): boots, themes
  correctly, route-gates to sign-in, and bundles cleanly through every stage
  (location, offers, native-map split, Sentry) with no runtime import errors.

## Follow-up for the operator

Native-only pieces — background GPS, the `@rnmapbox/maps` view, and Sentry native
symbolication — need a **device/simulator dev-build**; they can't be exercised
headlessly. Environment to set:

- **Vercel** (web): `NEXT_PUBLIC_SENTRY_DSN`; optionally `SENTRY_ORG` /
  `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` to enable source-map upload.
- **EAS / app config** (driver): `EXPO_PUBLIC_SUPABASE_URL`,
  `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_TRPC_URL`,
  `EXPO_PUBLIC_MAPBOX_TOKEN`, `EXPO_PUBLIC_SENTRY_DSN`; **`MAPBOX_DOWNLOAD_TOKEN`**
  (secret `sk.*` Downloads:Read token) for the native build to fetch the Maps
  SDK; optionally `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN`.
- Confirm Sentry events land by triggering a test capture on each platform once
  the DSNs are set (needs the Sentry dashboard, which isn't accessible here).
