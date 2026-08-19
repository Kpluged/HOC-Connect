import Mapbox, { Camera, MapView, PointAnnotation } from '@rnmapbox/maps';
import { StyleSheet, View } from 'react-native';

import { config } from '@/lib/config';
import { useTheme } from '@/lib/theme';

import type { LatLng, TripMapProps } from './trip-map.types';

// The pk. runtime token draws tiles. The sk. download token (native build only)
// is injected by app.config.ts — see that file.
if (config.mapboxToken) void Mapbox.setAccessToken(config.mapboxToken);

function bounds(points: LatLng[]) {
  const lngs = points.map((p) => p.lng);
  const lats = points.map((p) => p.lat);
  return {
    ne: [Math.max(...lngs), Math.max(...lats)] as [number, number],
    sw: [Math.min(...lngs), Math.min(...lats)] as [number, number],
    paddingTop: 56,
    paddingBottom: 56,
    paddingLeft: 56,
    paddingRight: 56,
  };
}

/**
 * Native trip map: monochrome Mapbox (matching the owner's dispatch map) with
 * pickup, drop-off and — when known — the driver's live position. Guards Red is
 * reserved for the drop-off/driver (the live, moving signal).
 */
export function TripMap({ pickup, dropoff, driver, height = 260 }: TripMapProps) {
  const t = useTheme();
  const points: LatLng[] = [pickup, dropoff, ...(driver ? [driver] : [])];

  return (
    <View style={[styles.wrap, { height, borderColor: t.border }]}>
      <MapView
        compassEnabled={false}
        scaleBarEnabled={false}
        style={StyleSheet.absoluteFill}
        styleURL={t.isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11'}
      >
        <Camera animationDuration={600} bounds={bounds(points)} />
        <PointAnnotation coordinate={[pickup.lng, pickup.lat]} id="pickup">
          <View style={[styles.pin, { backgroundColor: t.primary, borderColor: t.canvas }]} />
        </PointAnnotation>
        <PointAnnotation coordinate={[dropoff.lng, dropoff.lat]} id="dropoff">
          <View style={[styles.pin, { backgroundColor: t.signal, borderColor: t.canvas }]} />
        </PointAnnotation>
        {driver ? (
          <PointAnnotation coordinate={[driver.lng, driver.lat]} id="driver">
            <View style={[styles.driver, { backgroundColor: t.signal, borderColor: t.canvas }]} />
          </PointAnnotation>
        ) : null}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  pin: { borderRadius: 7, borderWidth: 2, height: 14, width: 14 },
  driver: { borderRadius: 9, borderWidth: 3, height: 18, width: 18 },
});
