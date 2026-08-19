import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/lib/theme';

import type { TripMapProps } from './trip-map.types';

/**
 * Fallback trip map for platforms without the native Mapbox view (web, Expo Go).
 * Metro resolves the native `@rnmapbox/maps` implementation from
 * trip-map.native.tsx on device; this keeps the heavy native dependency out of
 * the web bundle entirely. Shows the route legs so the screen is still useful.
 */
export function TripMap({ pickup, dropoff, driver, height = 260 }: TripMapProps) {
  const t = useTheme();
  return (
    <View style={[styles.wrap, { height, backgroundColor: t.surface, borderColor: t.border }]}>
      <Text style={[styles.badge, { color: t.muted }]}>Live map on device</Text>
      <View style={styles.leg}>
        <View style={[styles.dot, { backgroundColor: t.primary }]} />
        <Text style={[styles.label, { color: t.primary }]} numberOfLines={1}>
          {pickup.label}
        </Text>
      </View>
      <View style={[styles.rail, { backgroundColor: t.border }]} />
      <View style={styles.leg}>
        <View style={[styles.dot, { backgroundColor: t.signal }]} />
        <Text style={[styles.label, { color: t.primary }]} numberOfLines={1}>
          {dropoff.label}
        </Text>
      </View>
      {driver ? (
        <Text style={[styles.coords, { color: t.muted }]}>
          Driver at {driver.lat.toFixed(4)}, {driver.lng.toFixed(4)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 16, borderWidth: 1, gap: 10, justifyContent: 'center', padding: 20 },
  badge: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  leg: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  dot: { borderRadius: 999, height: 10, width: 10 },
  rail: { height: 18, marginLeft: 4, width: 2 },
  label: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  coords: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 4 },
});
