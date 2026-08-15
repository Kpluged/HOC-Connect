import "server-only";
import { z } from "zod";

/**
 * `KEY=` in a .env file sets process.env.KEY to "", not undefined - a bare
 * `.optional()` only skips validation for undefined, so an empty-but-present
 * var would otherwise fail. Blank strings are treated as absent.
 */
const optionalTrimmed = () =>
  z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(1).optional(),
  );

const optionalUrl = () =>
  z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.url().optional(),
  );

const serverEnvSchema = z.object({
  DATABASE_URL: optionalTrimmed(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  PAYSTACK_ADAPTER_MODE: z.enum(["stub", "live"]).default("stub"),
  PAYSTACK_SECRET_KEY: optionalTrimmed(),
  PREMBLY_ADAPTER_MODE: z.enum(["stub", "live"]).default("stub"),
  PREMBLY_API_KEY: optionalTrimmed(),
  PREMBLY_APP_ID: optionalTrimmed(),
  PREMBLY_BASE_URL: optionalUrl(),
  SUPABASE_SERVICE_ROLE_KEY: optionalTrimmed(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

/**
 * DATABASE_URL and SUPABASE_SERVICE_ROLE_KEY are optional here so that
 * typecheck/build never fail on a checkout without secrets configured yet.
 * Code that actually needs them calls requireDatabaseUrl()/
 * requireServiceRoleKey() below, which fail loudly at the point of use.
 */
export function getServerEnv(): ServerEnv {
  if (!cached) {
    cached = serverEnvSchema.parse(process.env);
  }
  return cached;
}

export function requireDatabaseUrl(): string {
  const { DATABASE_URL } = getServerEnv();
  if (!DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not configured. Add it to apps/web/.env.local " +
        "(Supabase Dashboard -> Project Settings -> Database -> Connection " +
        "string, Transaction pooler, port 6543).",
    );
  }
  return DATABASE_URL;
}

export function requireServiceRoleKey(): string {
  const { SUPABASE_SERVICE_ROLE_KEY } = getServerEnv();
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured. Add it to " +
        "apps/web/.env.local (Supabase Dashboard -> Project Settings -> API).",
    );
  }
  return SUPABASE_SERVICE_ROLE_KEY;
}
