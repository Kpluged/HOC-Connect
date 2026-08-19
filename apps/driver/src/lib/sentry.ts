import * as Sentry from '@sentry/react-native';

import { config } from './config';

/**
 * Initialise Sentry for the driver app. The DSN is client-safe and comes from
 * EXPO_PUBLIC_SENTRY_DSN; when absent Sentry stays disabled so local/dev runs
 * are silent. Called once at app entry from the root layout.
 */
export function initSentry() {
  if (!config.sentryDsn) return;
  Sentry.init({
    dsn: config.sentryDsn,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  });
}

export { Sentry };
