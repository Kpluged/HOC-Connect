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
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'HOC Elite Wheels Driver',
  slug: config.slug ?? 'hoc-elite-wheels-driver',
  plugins: [
    ...(config.plugins ?? []),
    [
      '@rnmapbox/maps',
      {
        RNMapboxMapsDownloadToken: process.env.MAPBOX_DOWNLOAD_TOKEN,
      },
    ],
  ],
});
