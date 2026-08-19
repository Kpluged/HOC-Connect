import { useCallback, useEffect, useRef, useState } from 'react';
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

import {
  goOffline,
  requestLocationPermissions,
  startLocationTracking,
} from '@/lib/location';
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
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  // Tracks whether we've already resumed streaming for a session that the
  // server still considers online, so re-fetches don't restart it repeatedly.
  const resumed = useRef(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [nextMe, nextTrips] = await Promise.all([api.driverMe(), api.myTrips()]);
      setMe(nextMe);
      setTrips(nextTrips);
      // Reopening the app while the server still has us available: quietly
      // resume streaming (permissions were granted earlier) so we keep moving
      // on the dispatch map instead of going stale.
      if (!resumed.current && nextMe?.operationalStatus === 'available') {
        resumed.current = true;
        void startLocationTracking(true).catch(() => undefined);
      }
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

  const goOnline = useCallback(async () => {
    setBusy(true);
    setNotice(null);
    try {
      const perms = await requestLocationPermissions();
      if (!perms.foreground) {
        setNotice('Location permission is required to go online. Enable it in Settings.');
        return;
      }
      if (!perms.background) {
        setNotice('Background location is off — you can go online, but tracking pauses when the app is in the background.');
      }
      await startLocationTracking(perms.background);
      resumed.current = true;
      await load();
    } catch {
      setNotice('Could not start location. Check that GPS is on and try again.');
    } finally {
      setBusy(false);
    }
  }, [load]);

  const goOff = useCallback(async () => {
    setBusy(true);
    setNotice(null);
    try {
      await goOffline();
      resumed.current = false;
      await load();
    } catch {
      setNotice('Could not go offline cleanly. Try again.');
    } finally {
      setBusy(false);
    }
  }, [load]);

  const activeTrips = trips.filter((trip) => !TERMINAL.has(trip.status));
  const status = me?.operationalStatus ?? 'offline';
  const isOnTrip = status === 'on_trip';
  const isOnline = status === 'available' || status === 'on_trip';

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
                  { backgroundColor: isOnTrip ? t.signal : status === 'available' ? t.primary : t.muted },
                ]}
              />
              <Text style={[styles.status, { color: t.primary }]}>
                {STATUS_LABEL[status] ?? status}
              </Text>
            </View>

            {/* Online / offline toggle — the driver's control over the matcher. */}
            {isOnTrip ? (
              <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
                <Text style={[styles.cardTitle, { color: t.primary }]}>You&apos;re on a trip</Text>
                <Text style={[styles.body, { color: t.muted }]}>
                  Your location is being shared live with dispatch for this ride.
                </Text>
              </View>
            ) : (
              <Pressable
                disabled={busy}
                onPress={() => void (isOnline ? goOff() : goOnline())}
                style={({ pressed }) => [
                  styles.toggle,
                  isOnline
                    ? { backgroundColor: t.surface, borderColor: t.border, borderWidth: 1 }
                    : { backgroundColor: t.signal },
                  { opacity: busy ? 0.6 : pressed ? 0.9 : 1 },
                ]}
              >
                {busy ? (
                  <ActivityIndicator color={isOnline ? t.primary : t.onSignal} />
                ) : (
                  <Text style={[styles.toggleText, { color: isOnline ? t.primary : t.onSignal }]}>
                    {isOnline ? 'Go offline' : 'Go online'}
                  </Text>
                )}
              </Pressable>
            )}

            {notice ? (
              <Text style={[styles.notice, { color: t.muted }]}>{notice}</Text>
            ) : null}

            {isOnline ? (
              <View style={styles.liveRow}>
                <View style={[styles.pulse, { backgroundColor: t.signal }]} />
                <Text style={[styles.liveText, { color: t.muted }]}>
                  Sharing your live location with dispatch
                </Text>
              </View>
            ) : null}

            <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
              <Text style={[styles.metric, { color: t.primary }]}>{activeTrips.length}</Text>
              <Text style={[styles.body, { color: t.muted }]}>
                {activeTrips.length === 1 ? 'active ride' : 'active rides'}
              </Text>
            </View>

            <Text style={[styles.note, { color: t.muted }]}>Pull down to refresh.</Text>
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
  toggle: { alignItems: 'center', borderRadius: 16, justifyContent: 'center', minHeight: 60, marginTop: 4 },
  toggleText: { fontFamily: 'Inter_700Bold', fontSize: 17, letterSpacing: -0.3 },
  notice: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, marginTop: -8 },
  liveRow: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: -8 },
  pulse: { borderRadius: 999, height: 8, width: 8 },
  liveText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  card: { borderRadius: 16, borderWidth: 1, gap: 4, padding: 20 },
  cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22 },
  metric: { fontFamily: 'Inter_700Bold', fontSize: 40, letterSpacing: -1.5 },
  note: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 },
  retry: { marginTop: 12 },
  retryText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
});
