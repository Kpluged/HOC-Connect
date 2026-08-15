import "server-only";
import { createDb } from "@hoc/db";

type Db = ReturnType<typeof createDb>;
export type ServiceRoleTransaction = Parameters<
  Parameters<Db["transaction"]>[0]
>[0];

let db: Db | undefined;

function getDb(): Db {
  if (!db) db = createDb();
  return db;
}

/**
 * Webhook-only. DATABASE_URL authenticates as Postgres role `postgres`
 * (rolbypassrls = true, confirmed live against the project) - unlike
 * with-rls.ts's withRLS(), this never downgrades to `authenticated` and
 * sees every row regardless of RLS. There is no verified end-user identity
 * behind a provider webhook call, so there is no claims payload to set
 * either. Every write done inside here MUST be scoped to a uniquely-matched
 * row (e.g. `WHERE provider_reference = $1 AND status = 'pending'`) so a
 * bug here can't silently touch unrelated tenants' data.
 */
export async function runAsServiceRole<T>(
  fn: (tx: ServiceRoleTransaction) => Promise<T>,
): Promise<T> {
  return getDb().transaction(fn);
}
