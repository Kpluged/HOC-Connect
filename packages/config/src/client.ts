import { z } from "zod";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

let cached: ClientEnv | undefined;

/**
 * Each NEXT_PUBLIC_* var is referenced as a direct `process.env.X` member
 * expression so Next's client bundler can statically inline it; do not
 * refactor this to spread or index into `process.env`.
 */
export function getClientEnv(): ClientEnv {
  if (!cached) {
    cached = clientEnvSchema.parse({
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    });
  }
  return cached;
}
