import "server-only";
import { createDb } from "@hoc/db";
import { sql } from "drizzle-orm";

type Db = ReturnType<typeof createDb>;
export type RLSTransaction = Parameters<Parameters<Db["transaction"]>[0]>[0];

let db: Db | undefined;

function getDb(): Db {
  if (!db) db = createDb();
  return db;
}

/**
 * Runs `fn` inside a transaction with `request.jwt.claims` set from
 * already-verified claims and the Postgres role switched to `authenticated`,
 * so RLS policies see the same auth.uid()/role a direct Supabase client
 * call would. `claims` must come from a verified source (e.g.
 * supabase.auth.getClaims()) - never a client-supplied value. See
 * docs/HOC-Connect-architecture-and-schema.md section 1.
 */
export async function withRLS<T>(
  claims: Record<string, unknown>,
  fn: (tx: RLSTransaction) => Promise<T>,
): Promise<T> {
  return getDb().transaction(async (tx) => {
    await tx.execute(
      sql`select set_config('request.jwt.claims', ${JSON.stringify(claims)}, true)`,
    );
    await tx.execute(sql`set local role authenticated`);
    return fn(tx);
  });
}
