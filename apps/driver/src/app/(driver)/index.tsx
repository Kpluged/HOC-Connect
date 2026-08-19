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
import { subscribeToOffers } from '@/lib/realtime';
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
  const [acting, setActing] = useState<string | null>(null);
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

  // Live offers: a broadcast on the driver's private topic re-fetches, which
  // surfaces the offered trip as an accept/decline card.
  useEffect(() => subscribeToOffers(() => void load()), [load]);

  const respond = useCallback(
    async (tripId: string, action: 'accept' | 'decline') => {
      setActing(tripId);
      setNotice(null);
      try {
        if (action === 'accept') await api.acceptOffer(tripId);
        else await api.declineOffer(tripId);
        await load();
      } catch (caught) {
        setNotice(
          caught instanceof Error ? caught.message : 'Could not respond to the offer. Try again.',
        );
      } finally {
        setActing(null);
      }
    },
    [load],
  );

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

  const offers = trips.filter((trip) => trip.status === 'offered');
  const activeTrips = trips.filter(
    (trip) => !TERMINAL.has(trip.status) && trip.status !== 'offered',
  );
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

            {/* Ride offers — the live, actionable moment: Guards-Red signal. */}
            {offers.map((offer) => (
              <View
                key={offer.id}
                style={[styles.offer, { backgroundColor: t.surface, borderColor: t.signal }]}
              >
                <Text style={[styles.offerEyebrow, { color: t.signal }]}>New ride offer</Text>
                <View style={styles.offerLeg}>
                  <View style={[styles.legDot, { backgroundColor: t.primary }]} />
                  <Text style={[styles.legText, { color: t.primary }]} numberOfLines={1}>
                    {offer.pickupLabel}
                  </Text>
                </View>
                <View style={styles.offerLeg}>
                  <View style={[styles.legDot, { backgroundColor: t.signal }]} />
                  <Text style={[styles.legText, { color: t.primary }]} numberOfLines={1}>
                    {offer.dropoffLabel}
                  </Text>
                </View>
                <View style={styles.offerActions}>
                  <Pressable
                    disabled={acting === offer.id}
                    onPress={() => void respond(offer.id, 'decline')}
                    style={({ pressed }) => [
                      styles.declineBtn,
                      { borderColor: t.border, opacity: acting === offer.id ? 0.5 : pressed ? 0.85 : 1 },
                    ]}
                  >
                    <Text style={[styles.declineText, { color: t.muted }]}>Decline</Text>
                  </Pressable>
                  <Pressable
                    disabled={acting === offer.id}
                    onPress={() => void respond(offer.id, 'accept')}
                    style={({ pressed }) => [
                      styles.acceptBtn,
                      { backgroundColor: t.signal, opacity: acting === offer.id ? 0.6 : pressed ? 0.9 : 1 },
                    ]}
                  >
                    {acting === offer.id ? (
                      <ActivityIndicator color={t.onSignal} />
                    ) : (
                      <Text style={[styles.acceptText, { color: t.onSignal }]}>Accept</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            ))}

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
  offer: { borderRadius: 16, borderWidth: 1.5, gap: 12, padding: 20 },
  offerEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' },
  offerLeg: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  legDot: { borderRadius: 999, height: 8, width: 8 },
  legText: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  offerActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  declineBtn: { alignItems: 'center', borderRadius: 12, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 52 },
  declineText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  acceptBtn: { alignItems: 'center', borderRadius: 12, flex: 2, justifyContent: 'center', minHeight: 52 },
  acceptText: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  card: { borderRadius: 16, borderWidth: 1, gap: 4, padding: 20 },
  cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22 },
  metric: { fontFamily: 'Inter_700Bold', fontSize: 40, letterSpacing: -1.5 },
  note: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 },
  retry: { marginTop: 12 },
  retryText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
});
