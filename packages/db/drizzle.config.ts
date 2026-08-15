import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "drizzle-kit";

// `generate` only diffs schema files against the local meta journal - it
// never opens this connection - so a placeholder keeps it working on a
// fresh checkout with no .env.local yet.
const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(here, "../../apps/web/.env.local") });

export default defineConfig({
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://placeholder:placeholder@localhost:5432/placeholder",
  },
  dialect: "postgresql",
  out: "../../supabase/migrations",
  schema: "./src/schema/index.ts",
  schemaFilter: ["app"],
});
