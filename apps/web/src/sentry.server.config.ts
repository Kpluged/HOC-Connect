// Sentry server-side init. Loaded from instrumentation.ts on the Node runtime.
// DSN comes from env (client-safe value, but kept out of the repo); when it is
// absent Sentry initialises disabled, so local/dev builds are silent.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  tracesSampleRate: 0.1,
  // Sensible defaults; PII off unless we deliberately attach it.
  sendDefaultPii: false,
});
