/**
 * Driver-app configuration, read from Expo public env (inlined at build).
 * All values are client-safe by design (anon key, pk Mapbox token, Sentry DSN).
 */
export const config = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
  trpcUrl: process.env.EXPO_PUBLIC_TRPC_URL ?? "",
  mapboxToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "",
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? "",
};

export const isConfigured = Boolean(
  config.supabaseUrl && config.supabaseAnonKey && config.trpcUrl,
);
