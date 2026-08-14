# HOC Connect — Architecture, Routes, Drizzle Schema, PostGIS, and RLS

Status: Milestone 2 proposal. No application scaffold or production migration has been created yet.

## 1. Architecture boundary

HOC Connect will use a workspace with two applications and shared packages:

- `apps/web`: Next.js App Router for the Storefront, commerce journey, Owner Space, and HOC Console.
- `apps/driver`: Expo/React Native for driver authentication, availability, offers, navigation handoff, live location, trip status, and earnings.
- `packages/db`: Drizzle schema, relations, RLS policy declarations, typed queries, and database transaction helpers.
- `packages/contracts`: shared Zod schemas and transport-safe domain types.
- `packages/design-tokens`: the monochrome `light-dark()` token contract shared by web and native implementations.
- `packages/integrations`: typed adapters for Paystack, Prembly, Mapbox, telemetry, email, notifications, and background jobs.

Supabase remains the system of record. Business tables live in a non-Data-API-exposed `app` schema. The web and driver applications call tRPC; tRPC verifies the Supabase access token and runs Drizzle inside a transaction that sets `request.jwt.claims` and `SET LOCAL ROLE authenticated`. This makes the same PostgreSQL RLS policies apply to tRPC queries instead of allowing the server database connection to bypass tenant isolation.

The Supabase publishable key is used only for Auth, Storage, and private Realtime channels. The service/secret key is server-only and limited to verified provider webhooks, controlled background work, and recovery operations.

## 2. Proposed workspace and file structure

```text
/
├── apps/
│   ├── web/
│   │   ├── public/
│   │   │   ├── brand/hoc-logo.png
│   │   │   └── vehicles/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── globals.css
│   │   │   │   ├── not-found.tsx
│   │   │   │   ├── global-error.tsx
│   │   │   │   ├── (marketing)/
│   │   │   │   ├── (commerce)/
│   │   │   │   ├── (auth)/
│   │   │   │   ├── (owner)/
│   │   │   │   ├── (admin)/
│   │   │   │   └── api/
│   │   │   │       ├── trpc/[trpc]/route.ts
│   │   │   │       └── webhooks/
│   │   │   │           ├── paystack/route.ts
│   │   │   │           └── prembly/route.ts
│   │   │   ├── components/
│   │   │   │   ├── ui/
│   │   │   │   ├── marketing/
│   │   │   │   ├── commerce/
│   │   │   │   ├── owner/
│   │   │   │   └── admin/
│   │   │   ├── features/
│   │   │   │   ├── catalogue/
│   │   │   │   ├── configurator/
│   │   │   │   ├── applications/
│   │   │   │   ├── dispatch/
│   │   │   │   ├── fleet/
│   │   │   │   ├── drivers/
│   │   │   │   ├── finance/
│   │   │   │   └── brand-studio/
│   │   │   ├── server/
│   │   │   │   ├── auth/
│   │   │   │   ├── db/with-rls.ts
│   │   │   │   ├── trpc/
│   │   │   │   │   ├── context.ts
│   │   │   │   │   ├── root.ts
│   │   │   │   │   └── routers/
│   │   │   │   └── services/
│   │   │   ├── lib/
│   │   │   │   ├── supabase/
│   │   │   │   ├── locale/
│   │   │   │   └── validation/
│   │   │   └── proxy.ts
│   │   ├── next.config.ts
│   │   └── package.json
│   └── driver/
│       ├── app/
│       │   ├── _layout.tsx
│       │   ├── (auth)/sign-in.tsx
│       │   └── (driver)/
│       │       ├── index.tsx
│       │       ├── offers/[tripId].tsx
│       │       ├── trip/[tripId].tsx
│       │       ├── earnings.tsx
│       │       └── profile.tsx
│       ├── src/
│       │   ├── features/
│       │   ├── lib/supabase.ts
│       │   ├── lib/trpc.ts
│       │   └── services/location.ts
│       ├── app.json
│       └── package.json
├── packages/
│   ├── db/
│   │   ├── src/
│   │   │   ├── schema/
│   │   │   │   ├── enums.ts
│   │   │   │   ├── identity.ts
│   │   │   │   ├── organizations.ts
│   │   │   │   ├── catalogue.ts
│   │   │   │   ├── commerce.ts
│   │   │   │   ├── operations.ts
│   │   │   │   ├── finance.ts
│   │   │   │   ├── system.ts
│   │   │   │   └── index.ts
│   │   │   ├── relations/
│   │   │   ├── queries/
│   │   │   ├── rls/
│   │   │   ├── geo.ts
│   │   │   └── client.ts
│   │   ├── drizzle.config.ts
│   │   └── package.json
│   ├── contracts/
│   ├── design-tokens/
│   ├── integrations/
│   │   ├── paystack/
│   │   ├── prembly/
│   │   ├── mapbox/
│   │   ├── telemetry/
│   │   ├── email/
│   │   ├── notifications/
│   │   └── jobs/
│   └── config/
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   ├── seed.sql
│   └── tests/
│       ├── rls/
│       ├── commerce/
│       └── dispatch/
├── docs/
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

`proxy.ts` performs optimistic route/session redirects only. Database authorization remains in RLS and is never delegated to Proxy.

## 3. Web route structure

### Storefront — `app/(marketing)`

| Route | Purpose |
|---|---|
| `/` | Brand entry, ownership proposition, vehicle and city story |
| `/vehicles` | EV catalogue, class filters, city availability, comparison |
| `/vehicles/[model]` | Specification, gallery, sticky section navigation, add to configuration |
| `/packages` | Package comparison and inclusions |
| `/cities` | Launch cities, capacity and waitlist state |
| `/brand-your-service` | Naming, mark, livery and future rider-surface explanation |
| `/operations` | Dispatch, drivers, charging, maintenance and care explanations |
| `/how-it-works` | Discover → configure/apply → approve/provision → operate/earn |
| `/about` | Reserved for approved HOC factual copy |
| `/contact` | Contact and enquiry route |

### Commerce — `app/(commerce)`

| Route | Purpose |
|---|---|
| `/configure/[step]` | `city`, `size`, `mix`, `livery`, `package`, `review` |
| `/apply/[step]` | `identity`, `company`, `documents`, `review` |
| `/orders/[orderId]` | Contract, reservation payment, balance and delivery state |
| `/account` | Account overview |
| `/account/configurations` | Saved and resumable fleet configurations |
| `/account/applications` | Application status and required actions |
| `/account/contracts` | Agreements and signed documents |

### Authentication — `app/(auth)`

`/auth/sign-in`, `/auth/verify`, `/auth/callback`, `/auth/sign-out` with email and phone OTP support.

### Owner Space — `app/(owner)/space`

| Route | Purpose |
|---|---|
| `/space` | Live overview, Signal Line, active trips, fleet health and earnings |
| `/space/dispatch` | Mapbox live dispatch, incoming requests, nearest drivers, assignment and trip monitoring |
| `/space/fleet` | Fleet list and telemetry state |
| `/space/fleet/[vehicleId]` | Vehicle detail, charging, maintenance and trip history |
| `/space/drivers` | Roster, vetting, availability and assignment |
| `/space/drivers/[driverId]` | Driver detail, shifts and completed trips |
| `/space/energy` | Charging sessions and energy cost |
| `/space/maintenance` | Maintenance and faults |
| `/space/brand` | Trading name, mark and livery; UI chrome remains HOC monochrome |
| `/space/earnings` | Revenue, costs, payouts and invoices |
| `/space/settings` | Organization and access settings |

### HOC Console — `app/(admin)/admin`

| Route | Purpose |
|---|---|
| `/admin` | Cross-tenant operational summary |
| `/admin/applications` | Review queue |
| `/admin/applications/[applicationId]` | KYC documents, notes, approve/decline |
| `/admin/inventory` | Vehicle models and physical stock/allocation |
| `/admin/cities` | Capacity, slot holds and availability |
| `/admin/organizations/[organizationId]` | Tenant oversight and support |
| `/admin/drivers` | Driver supply and vetting |
| `/admin/trips` | Cross-tenant live-ride oversight |
| `/admin/billing` | Orders, payments, payouts and invoices |

## 4. Canonical Drizzle/Postgres model

All application tables use `timestamptz`, UUID primary keys for externally addressable records, explicit currency codes, integer minor units for money, foreign-key indexes, and RLS. High-volume append-only events use `bigint identity` keys.

### Identity and tenancy

| Table | Important columns and constraints |
|---|---|
| `profiles` | `id` FK `auth.users.id`, `full_name`, `phone`, `onboarding_state`, timestamps |
| `platform_roles` | `user_id`, `role: hoc_staff | hoc_admin`, `status`; unique active role per user |
| `cities` | `name`, `country_code`, `currency`, `timezone`, `slots_total`, `service_area geography(MultiPolygon,4326)`, `status`, `launch_at` |
| `organizations` | `name`, unique `slug`, `city_id`, `status: draft | applied | approved | live | suspended`, `currency`, `timezone`, `created_by` |
| `organization_branding` | one-to-one `organization_id`, `trading_name`, `brand_mark_path`, `brand_colour`, `livery` JSONB |
| `organization_memberships` | `organization_id`, `user_id`, `role: owner | dispatcher | driver`, `status`; unique pair |

### Catalogue and availability

| Table | Important columns and constraints |
|---|---|
| `vehicle_models` | `slug`, `name`, `class`, nullable verified specifications, nullable `unit_price_minor`, `currency`, `publication_status` |
| `vehicle_model_media` | `vehicle_model_id`, `kind`, `storage_path`, `alt_text`, `sort_order` |
| `city_vehicle_availability` | `city_id`, `vehicle_model_id`, `status: available | waitlist | unavailable`, optional delivery window |
| `fleet_packages` | `city_id`, `name`, `vehicle_count`, included-month columns, `base_price_minor`, `currency`, `status` |

Unknown catalogue figures remain `NULL` and render as “Specification pending”; they are not replaced with plausible invented values.

### Configuration, application, contract, and payment

| Table | Important columns and constraints |
|---|---|
| `fleet_configurations` | `user_id`, optional draft `organization_id`, `city_id`, `package_id`, `status`, unique hashed `resume_token`, `total_minor`, `currency`, `expires_at` |
| `fleet_configuration_items` | `configuration_id`, `vehicle_model_id`, `quantity`, price snapshot, `allocation_state`; unique model per configuration |
| `applications` | `organization_id`, `applicant_user_id`, `configuration_id`, validated company details, Prembly reference/status, decision state and timestamps |
| `application_documents` | tenant/application IDs, document kind, private Storage path, scan status, uploader |
| `application_notes` | tenant/application IDs, author, body, internal flag; append-only |
| `contracts` | tenant/application IDs, terms version, private document path, signature reference and time |
| `orders` | tenant/application IDs, total/deposit/balance minor units, currency, status, reservation expiry, due and paid timestamps |
| `payments` | tenant/order IDs, provider fixed to `paystack`, unique provider reference, unique idempotency key, kind, amount, currency, status, sanitized provider metadata |
| `city_slot_holds` | tenant/city/order IDs, quantity, `held | consumed | expired | released`, expiry; active-hold uniqueness |

### Fleet, drivers, dispatch, telemetry, and care

| Table | Important columns and constraints |
|---|---|
| `vehicles` | model and tenant IDs, unique VIN, plate, telematics reference, lifecycle status, allocation/delivery timestamps |
| `drivers` | tenant ID, optional profile ID, display name, Prembly/licence references, status, `current_location geography(Point,4326)`, last-seen time |
| `shifts` | tenant, driver and vehicle IDs, start/end, trip count, gross revenue minor units and currency |
| `trips` | tenant ID, manual/corporate/API source, optional external/rider reference, driver/vehicle IDs, pickup/drop-off labels and geography points, status, distance, energy, fare minor units, lifecycle timestamps |
| `trip_events` | bigint identity, tenant/trip IDs, event type, actor, validated payload, timestamp; append-only audit stream |
| `vehicle_telemetry_snapshots` | one row per vehicle, location geography point, state of charge, odometer, health state, source and observed time; adapter-write only |
| `charging_sessions` | tenant, vehicle and optional driver IDs, location, energy, cost minor units, currency, start/end |
| `maintenance_tickets` | tenant/vehicle IDs, type, severity, status, notes and opened/closed timestamps |

Trip status is a real lifecycle:

```text
requested → offered → assigned → driver_en_route → driver_arrived
          → in_progress → completed
          ↘ cancelled
```

Assignment and lifecycle transitions run through database functions that validate the current state, actor, tenant, driver availability, and vehicle availability in one transaction. Clients never receive unrestricted column-level update access to `trips`.

### Finance and system records

| Table | Important columns and constraints |
|---|---|
| `payouts` | tenant, period, gross/cost/net minor-unit columns, currency, Paystack recipient/reference, status |
| `invoices` | tenant, period, kind, amount minor, currency, due/paid timestamps, status |
| `audit_logs` | bigint identity, tenant, actor, action, entity, entity ID, redacted before/after JSON, request ID, timestamp; immutable |
| `outbox_events` | event kind, aggregate reference, payload, availability time, attempts and delivery state; background-worker only |
| `webhook_receipts` | provider, unique event ID, signature result, received/processed times and redacted payload; server-only |

## 5. Drizzle foundation

The implementation will be split by domain, but the foundation is:

```ts
import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  customType,
  index,
  integer,
  jsonb,
  pgEnum,
  pgPolicy,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import {
  anonRole,
  authenticatedRole,
  authUid,
  authUsers,
  realtimeMessages,
  realtimeTopic,
} from "drizzle-orm/supabase";

export const app = pgSchema("app");

export type GeoPoint = { latitude: number; longitude: number };

export const geographyPoint = customType<{
  data: GeoPoint;
  driverData: string;
}>({
  dataType: () => "gis.geography(Point,4326)",
  toDriver: ({ latitude, longitude }) =>
    `SRID=4326;POINT(${longitude} ${latitude})`,
  // Normal reads project ST_X/ST_Y explicitly; raw geography output is not
  // passed directly through the transport boundary.
});

export const moneyMinor = (name: string) =>
  bigint(name, { mode: "number" });

export const timestamps = () => ({
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
```

Representative tenant and dispatch tables:

```ts
export const organizationRole = app.enum("organization_role", [
  "owner",
  "dispatcher",
  "driver",
]);

export const tripStatus = app.enum("trip_status", [
  "requested",
  "offered",
  "assigned",
  "driver_en_route",
  "driver_arrived",
  "in_progress",
  "completed",
  "cancelled",
]);

export const organizationMemberships = app.table(
  "organization_memberships",
  {
    organizationId: uuid("organization_id").notNull(),
    userId: uuid("user_id").notNull(),
    role: organizationRole("role").notNull(),
    status: text("status", { enum: ["invited", "active", "disabled"] })
      .notNull()
      .default("invited"),
    ...timestamps(),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.userId] }),
    index("organization_memberships_user_idx").on(table.userId, table.status),
    index("organization_memberships_org_role_idx").on(
      table.organizationId,
      table.role,
      table.status,
    ),
  ],
);

export const drivers = app.table(
  "drivers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    profileId: uuid("profile_id"),
    displayName: text("display_name").notNull(),
    status: text("status", {
      enum: ["pending_vetting", "offline", "available", "on_trip", "suspended"],
    }).notNull(),
    currentLocation: geographyPoint("current_location"),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    ...timestamps(),
  },
  (table) => [
    index("drivers_org_status_idx").on(table.organizationId, table.status),
    uniqueIndex("drivers_profile_idx").on(table.profileId),
    index("drivers_available_location_gist")
      .using("gist", table.currentLocation)
      .where(sql`${table.status} = 'available' and ${table.currentLocation} is not null`),
  ],
);

export const trips = app.table(
  "trips",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    vehicleId: uuid("vehicle_id"),
    driverId: uuid("driver_id"),
    source: text("source", {
      enum: ["manual", "corporate", "api", "rider_future"],
    }).notNull().default("manual"),
    riderRef: text("rider_ref"),
    pickupLabel: text("pickup_label").notNull(),
    pickup: geographyPoint("pickup").notNull(),
    dropoffLabel: text("dropoff_label").notNull(),
    dropoff: geographyPoint("dropoff").notNull(),
    status: tripStatus("status").notNull().default("requested"),
    fareMinor: moneyMinor("fare_minor"),
    currency: text("currency").notNull(),
    requestedAt: timestamp("requested_at", { withTimezone: true }).defaultNow().notNull(),
    matchedAt: timestamp("matched_at", { withTimezone: true }),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps(),
  },
  (table) => [
    check("trips_fare_nonnegative", sql`${table.fareMinor} is null or ${table.fareMinor} >= 0`),
    index("trips_org_status_requested_idx").on(
      table.organizationId,
      table.status,
      table.requestedAt,
    ),
    index("trips_driver_status_idx").on(table.driverId, table.status),
    index("trips_pickup_gist").using("gist", table.pickup),
    index("trips_dropoff_gist").using("gist", table.dropoff),
  ],
);
```

Foreign-key declarations and their indexes will be present in the implementation files; they are abbreviated above only to keep the proposal readable.

## 6. PostGIS and dispatch queries

The first migration enables PostGIS in the dedicated `gis` schema without pinning an extension version:

```sql
create schema if not exists gis;
create extension if not exists postgis with schema gis;
```

Spatial columns:

- `cities.service_area`: `geography(MultiPolygon,4326)` with GiST index.
- `drivers.current_location`: `geography(Point,4326)` with a partial GiST index for available drivers.
- `vehicle_telemetry_snapshots.location`: `geography(Point,4326)` with GiST index.
- `trips.pickup` and `trips.dropoff`: `geography(Point,4326)` with GiST indexes.

Nearest-driver matching is tenant-scoped and index-backed:

```sql
select
  d.id,
  gis.st_distance(d.current_location, $pickup) as distance_meters
from app.drivers d
where d.organization_id = $organization_id
  and d.status = 'available'
  and d.current_location is not null
  and gis.st_dwithin(d.current_location, $pickup, $radius_meters)
order by d.current_location operator(gis.<->) $pickup
limit $limit;
```

Phase 1 returns candidates for manual assignment. Automated matching can reuse this query behind a worker in Phase 2.

## 7. RLS model

### Policy helpers

Authorization is based on indexed database records, not editable JWT user metadata. Helper functions live in a non-exposed `private` schema, explicitly check `auth.uid()`, return booleans only, and run with an empty search path.

```sql
create schema if not exists private;

create or replace function private.is_hoc_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from app.platform_roles pr
      where pr.user_id = (select auth.uid())
        and pr.role in ('hoc_staff', 'hoc_admin')
        and pr.status = 'active'
    );
$$;

create or replace function private.has_org_role(
  target_organization_id uuid,
  allowed_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from app.organization_memberships membership
      where membership.organization_id = target_organization_id
        and membership.user_id = (select auth.uid())
        and membership.status = 'active'
        and membership.role::text = any (allowed_roles)
    );
$$;

create or replace function private.can_view_org(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.is_hoc_staff())
    or (select private.has_org_role(
      target_organization_id,
      array['owner', 'dispatcher', 'driver']
    ));
$$;

revoke all on schema private from public;
revoke all on all functions in schema private from public;
grant usage on schema private to authenticated;
grant execute on function private.is_hoc_staff() to authenticated;
grant execute on function private.has_org_role(uuid, text[]) to authenticated;
grant execute on function private.can_view_org(uuid) to authenticated;
```

### Drizzle policy pattern

```ts
const hocStaff = sql`(select private.is_hoc_staff())`;
const canViewOrg = (organizationId: unknown) =>
  sql`(select private.can_view_org(${organizationId}))`;
const canManageOrg = (organizationId: unknown) =>
  sql`${hocStaff} or (select private.has_org_role(
    ${organizationId}, array['owner', 'dispatcher']::text[]
  ))`;

// Applied to tenant tables. UPDATE policies always include both clauses.
pgPolicy("tenant members can select trips", {
  for: "select",
  to: authenticatedRole,
  using: canViewOrg(trips.organizationId),
});

pgPolicy("tenant managers can insert trips", {
  for: "insert",
  to: authenticatedRole,
  withCheck: canManageOrg(trips.organizationId),
});
```

### Complete access matrix

| Tables | Anonymous | Prospect/applicant | Owner/dispatcher | Driver | HOC staff/admin | System adapter |
|---|---|---|---|---|---|---|
| Published cities, models, media, availability, packages | Select published | Select published | Select published | Select published | CRUD | — |
| Profiles | — | Own select/update | Own select/update | Own select/update | Select | Auth trigger creates |
| Platform roles | — | Own select only | Own select only | Own select only | Own select | Service-only manage |
| Organizations | — | Own draft select | Tenant select | Tenant select | CRUD | — |
| Organization branding | — | Draft owner | Tenant select; owner update | Tenant select | CRUD | — |
| Memberships | — | Own row | Owner manages; member sees own | Own row | CRUD | Invite worker |
| Configurations/items | — | Own CRUD while draft | Own/tenant read | — | Read/update review state | Expiry worker |
| Applications/documents | — | Own create/read/update while draft | Tenant read | — | Review/update | Prembly webhook updates KYC only |
| Application notes | — | — | — | — | Append/read | — |
| Contracts/orders | — | Own read | Tenant-owner read | — | CRUD/transition | Contract/order worker |
| Payments | — | Own/tenant read | Tenant-owner read | — | Read | Paystack webhook insert/transition |
| Slot holds | — | Own read | Tenant-owner read | — | CRUD | Expiry/payment workers |
| Vehicles | — | — | Tenant read | Assigned vehicle read | CRUD | Telemetry/allocation writes |
| Drivers | — | — | Tenant read/manage | Own read | CRUD | Prembly status updates |
| Shifts | — | — | Tenant read/manage | Own read | CRUD | Lifecycle worker |
| Trips | — | — | Tenant read/create/assign through functions | Assigned trips read/transition through functions | All | Dispatch worker |
| Trip events | — | — | Tenant read | Assigned-trip read | All | Append only |
| Telemetry snapshots | — | — | Tenant read | Assigned vehicle read | All | Write only |
| Charging/maintenance | — | — | Tenant read/manage | Assigned records read | CRUD | Provider updates |
| Payouts/invoices | — | — | Owner read | — | CRUD | Paystack/billing worker |
| Audit logs | — | — | Redacted tenant view later | — | Read | Append only |
| Outbox/webhook receipts | — | — | — | — | Read operational state | CRUD |

No user-facing policy grants arbitrary `DELETE`. Records move through explicit statuses and retain an audit trail.

### Storage RLS

Private buckets:

- `kyc-documents`: applicant can upload/read only under `<user-id>/<application-id>/...`; HOC staff can read; no public URLs.
- `organization-marks`: owners can manage only the prefix for organizations where they are an active owner; members can read signed URLs.

Storage upsert policies include `INSERT`, `SELECT`, and `UPDATE`; the secret/service key is never shipped to either client.

## 8. Realtime authorization

High-frequency state uses private Supabase Realtime Broadcast rather than publishing every raw location row through Postgres Changes.

| Topic | Who writes | Who reads |
|---|---|---|
| `driver:<profile-id>:location` | That driver only | Same-organization owner/dispatcher and HOC staff |
| `driver:<profile-id>:offers` | Same-organization owner/dispatcher or dispatch worker | That driver only |
| `trip:<trip-id>` | Controlled lifecycle function/worker | Assigned driver, same-organization managers, HOC staff |
| `org:<organization-id>:dispatch` | Same-organization managers/worker | Same-organization managers and HOC staff |

Policies are linked to the existing `realtime.messages` table through Drizzle. No tables, functions, or columns are created or altered inside the locked `realtime` schema.

Representative linked policy:

```ts
export const receiveOrganizationBroadcasts = pgPolicy(
  "members can receive organization broadcasts",
  {
    for: "select",
    to: authenticatedRole,
    using: sql`
      realtime.messages.extension = 'broadcast'
      and exists (
        select 1
        from app.organization_memberships membership
        where membership.user_id = ${authUid}
          and membership.status = 'active'
          and ${realtimeTopic} =
            'org:' || membership.organization_id::text || ':dispatch'
      )
    `,
  },
).link(realtimeMessages);
```

Persisted snapshots and trip events remain in Postgres for recovery, reporting, and audit. Broadcast payloads are ephemeral and are never treated as the financial or trip-lifecycle source of truth.

## 9. Database invariants and transactions

1. **City capacity:** reservation locks the city row, expires stale holds, checks active holds plus allocated vehicles against `slots_total`, then inserts a hold. Over-capacity configurations become waitlisted.
2. **Payment idempotency:** Paystack event ID, provider reference, and internal idempotency key are unique. Signature verification happens before mutation.
3. **Provisioning:** approval permits contract/order creation; reservation payment holds capacity; physical vehicle allocation and live activation require `paid_in_full`.
4. **Money:** all amounts are non-negative integer minor units with a three-letter currency code. No floating-point money.
5. **Tenant immutability:** tenant IDs cannot be changed by update policies.
6. **Trip transitions:** assignment and status changes use transactional functions; every successful transition appends a `trip_events` row and an `audit_logs` row.
7. **Telemetry:** provider adapters may update snapshots but may not mutate orders, payments, trips, or tenant membership.
8. **Audit:** trip events, application notes, payment events, webhook receipts, and audit logs are append-only.
9. **Views:** any exposed/read model uses `security_invoker = true` so underlying RLS remains effective.

## 10. Index plan

- B-tree index on every foreign key and every column used by RLS.
- Composite indexes led by `organization_id` for tenant list queries.
- Partial B-tree indexes for active trips, pending applications, active slot holds, pending payments, and undelivered outbox events.
- GiST indexes for all PostGIS geography columns.
- BRIN index on timestamps for high-volume append-only `trip_events` and `audit_logs` once volume justifies it.
- Unique indexes for organization slug, model slug, VIN, configuration resume-token hash, Paystack provider reference, payment idempotency key, and webhook event ID.

## 11. Migration order and verification

1. Create `app`, `private`, and `gis` schemas; enable PostGIS without a version pin.
2. Declare enums and identity/tenancy tables.
3. Add catalogue and commerce tables.
4. Add operational, finance, and system tables.
5. Add foreign keys, checks, B-tree/partial/GiST indexes.
6. Add capacity, provisioning, dispatch, trip-transition, audit, and updated-at functions/triggers.
7. Enable/force RLS and install table policies plus least-privilege grants.
8. Install Storage policies.
9. Link private Realtime Broadcast policies to `realtime.messages`.
10. Add deterministic demo seed data explicitly labelled as demo.
11. Run RLS isolation tests as two tenants, a driver, HOC staff, anon, authenticated-without-membership, and service role.
12. Run PostGIS nearest-driver tests, payment idempotency tests, capacity race tests, database advisors, and migration verification.

## 12. Current-platform notes

- Supabase now recommends private Broadcast channels for scalable, authorized realtime flows; Postgres Changes remains suitable for simpler low-volume cases.
- The `realtime` schema is locked against structural changes; policies on `realtime.messages` remain supported.
- New tables are no longer assumed to be exposed automatically through the Data API. HOC Connect intentionally keeps the `app` schema unexposed and serves business operations through tRPC with RLS context.
- Supabase extension version pinning is deprecated, so the PostGIS migration does not pin a version.
- Next.js 16 uses `proxy.ts`; it is used only for optimistic redirects, never as the authorization boundary.

Official references:

- https://supabase.com/changelog.md
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/database/extensions/postgis
- https://supabase.com/docs/guides/realtime/authorization
- https://supabase.com/docs/guides/realtime/subscribing-to-database-changes
- https://orm.drizzle.team/docs/rls
- https://orm.drizzle.team/docs/custom-types
- https://nextjs.org/docs/app/getting-started/project-structure
