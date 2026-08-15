import { requireDatabaseUrl } from "@hoc/config/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

export type Database = ReturnType<typeof createDb>;

/**
 * Uses the Supabase transaction pooler (port 6543) - `prepare: false` is
 * required there since pgbouncer transaction mode doesn't support prepared
 * statements.
 */
export function createDb() {
  const client = postgres(requireDatabaseUrl(), { prepare: false });
  return drizzle(client, { schema });
}
