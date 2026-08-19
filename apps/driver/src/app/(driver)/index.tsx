import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';
import { api, type DriverMe, type DriverTrip } from '@/lib/trpc';

const STATUS_LABEL: Record<string, string> = {
  offline: 'Offline',
  available: 'Available',
  on_trip: 'On a trip',
};
const TERMINAL = new Set(['completed', 'cancelled']);

export default function DriverHome() {
  const t = useTheme();
  const [me, setMe] = useState<DriverMe>(null);
  const [trips, setTrips] = useState<DriverTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [nextMe, nextTrips] = await Promise.all([api.driverMe(), api.myTrips()]);
      setMe(nextMe);
      setTrips(nextTrips);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load your profile.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Mount fetch: load() only sets state after awaiting, not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const activeTrips = trips.filter((trip) => !TERMINAL.has(trip.status));
  const isOnTrip = me?.operationalStatus === 'on_trip';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.canvas }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
            refreshing={refreshing}
            tintColor={t.muted}
          />
        }
      >
        <View style={styles.headerRow}>
          <Text style={[styles.eyebrow, { color: t.muted }]}>HOC Elite Wheels · Driver</Text>
          <Pressable onPress={() => void supabase.auth.signOut()}>
            <Text style={[styles.signOut, { color: t.muted }]}>Sign out</Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator color={t.muted} style={{ marginTop: 48 }} />
        ) : error ? (
          <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[styles.cardTitle, { color: t.primary }]}>Something went wrong</Text>
            <Text style={[styles.body, { color: t.muted }]}>{error}</Text>
            <Pressable onPress={() => void load()} style={styles.retry}>
              <Text style={[styles.retryText, { color: t.primary }]}>Try again</Text>
            </Pressable>
          </View>
        ) : !me ? (
          <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[styles.cardTitle, { color: t.primary }]}>Not a driver yet</Text>
            <Text style={[styles.body, { color: t.muted }]}>
              This account isn&apos;t linked to a driver profile. Ask your fleet to add you as a
              driver.
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.heading, { color: t.primary }]}>{me.displayName}</Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: isOnTrip ? t.signal : me.operationalStatus === 'available' ? t.primary : t.muted },
                ]}
              />
              <Text style={[styles.status, { color: t.primary }]}>
                {STATUS_LABEL[me.operationalStatus] ?? me.operationalStatus}
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
              <Text style={[styles.metric, { color: t.primary }]}>{activeTrips.length}</Text>
              <Text style={[styles.body, { color: t.muted }]}>
                {activeTrips.length === 1 ? 'active ride' : 'active rides'}
              </Text>
            </View>

            <Text style={[styles.note, { color: t.muted }]}>
              Going online and live location arrive next. Pull down to refresh.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { gap: 20, padding: 24, paddingTop: 12 },
  headerRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  eyebrow: { fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase' },
  signOut: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  heading: { fontFamily: 'Inter_700Bold', fontSize: 34, letterSpacing: -1.2, marginTop: 8 },
  statusRow: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: -8 },
  dot: { borderRadius: 999, height: 10, width: 10 },
  status: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  card: { borderRadius: 16, borderWidth: 1, gap: 4, padding: 20 },
  cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  metric: { fontFamily: 'Inter_700Bold', fontSize: 40, letterSpacing: -1.5 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22 },
  note: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 },
  retry: { marginTop: 12 },
  retryText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
});
