import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Dynamic Expo config. Everything static lives in app.json; here we only inject
 * the @rnmapbox/maps config plugin, whose download token is a *secret* and must
 * not be committed.
 *
 * RNMapboxMapsDownloadToken is a Mapbox "Downloads:Read" (sk.) token used ONLY
 * at native build time (CocoaPods/Gradle fetch the SDK). It is different from
 * the public pk. runtime token (EXPO_PUBLIC_MAPBOX_TOKEN) the map uses to draw
 * tiles. Set MAPBOX_DOWNLOAD_TOKEN as an EAS secret before `eas build`; it is
 * read at config-eval time and never inlined into the client bundle.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const plugins: NonNullable<ExpoConfig['plugins']> = [
    ...(config.plugins ?? []),
    [
      '@rnmapbox/maps',
      {
        RNMapboxMapsDownloadToken: process.env.MAPBOX_DOWNLOAD_TOKEN,
      },
    ],
  ];

  // The Sentry Expo plugin uploads source maps at native build time. Include it
  // only when the org/project are configured, so an unconfigured prebuild never
  // fails; runtime error capture (Sentry.init) works regardless. Set
  // SENTRY_ORG / SENTRY_PROJECT / SENTRY_AUTH_TOKEN as EAS secrets to enable it.
  if (process.env.SENTRY_ORG && process.env.SENTRY_PROJECT) {
    plugins.push([
      '@sentry/react-native/expo',
      { organization: process.env.SENTRY_ORG, project: process.env.SENTRY_PROJECT },
    ]);
  }

  return {
    ...config,
    name: config.name ?? 'HOC Elite Wheels Driver',
    slug: config.slug ?? 'hoc-elite-wheels-driver',
    plugins,
  };
};
