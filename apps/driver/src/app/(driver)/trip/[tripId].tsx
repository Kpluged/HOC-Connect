import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TripMap } from '@/components/trip-map';
import { useTheme } from '@/lib/theme';
import { api, type DriverMe, type DriverTrip } from '@/lib/trpc';

const STATUS_LABEL: Record<string, string> = {
  assigned: 'Assigned',
  driver_en_route: 'En route to pickup',
  driver_arrived: 'Arrived at pickup',
  in_progress: 'Trip in progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};
// The driver's forward path through a trip.
const NEXT: Record<string, { next: string; cta: string }> = {
  assigned: { next: 'driver_en_route', cta: 'Start driving to pickup' },
  driver_en_route: { next: 'driver_arrived', cta: "I've arrived" },
  driver_arrived: { next: 'in_progress', cta: 'Start the trip' },
  in_progress: { next: 'completed', cta: 'Complete the trip' },
};

export default function TripScreen() {
  const t = useTheme();
  const router = useRouter();
  const { tripId } = useLocalSearchParams<{ tripId: string }>();

  const [trip, setTrip] = useState<DriverTrip | null>(null);
  const [me, setMe] = useState<DriverMe>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [trips, nextMe] = await Promise.all([api.myTrips(), api.driverMe()]);
      setTrip(trips.find((candidate) => candidate.id === tripId) ?? null);
      setMe(nextMe);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load this trip.');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const advance = useCallback(async () => {
    if (!trip) return;
    const step = NEXT[trip.status];
    if (!step) return;
    setBusy(true);
    setError(null);
    try {
      await api.transitionTrip({ tripId: trip.id, next: step.next });
      if (step.next === 'completed') {
        router.back();
        return;
      }
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not update the trip. Try again.');
    } finally {
      setBusy(false);
    }
  }, [trip, router, load]);

  const step = trip ? NEXT[trip.status] : undefined;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.canvas }]} edges={['bottom']}>
      <Stack.Screen options={{ headerShown: true, title: 'Trip', headerBackTitle: 'Back' }} />
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator color={t.muted} style={{ marginTop: 48 }} />
        ) : error && !trip ? (
          <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[styles.cardTitle, { color: t.primary }]}>Something went wrong</Text>
            <Text style={[styles.body, { color: t.muted }]}>{error}</Text>
            <Pressable onPress={() => void load()} style={styles.retry}>
              <Text style={[styles.retryText, { color: t.primary }]}>Try again</Text>
            </Pressable>
          </View>
        ) : !trip ? (
          <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[styles.cardTitle, { color: t.primary }]}>Trip not found</Text>
            <Text style={[styles.body, { color: t.muted }]}>
              This trip is no longer active. Head back to your rides.
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.status, { color: t.primary }]}>
              {STATUS_LABEL[trip.status] ?? trip.status}
            </Text>

            <TripMap
              driver={me?.lat != null && me?.lng != null ? { lat: me.lat, lng: me.lng } : null}
              dropoff={{ lat: trip.dropoffLat, lng: trip.dropoffLng, label: trip.dropoffLabel }}
              pickup={{ lat: trip.pickupLat, lng: trip.pickupLng, label: trip.pickupLabel }}
            />

            <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
              <View style={styles.leg}>
                <View style={[styles.dot, { backgroundColor: t.primary }]} />
                <View style={styles.legText}>
                  <Text style={[styles.legEyebrow, { color: t.muted }]}>Pickup</Text>
                  <Text style={[styles.legLabel, { color: t.primary }]}>{trip.pickupLabel}</Text>
                </View>
              </View>
              <View style={[styles.rail, { backgroundColor: t.border }]} />
              <View style={styles.leg}>
                <View style={[styles.dot, { backgroundColor: t.signal }]} />
                <View style={styles.legText}>
                  <Text style={[styles.legEyebrow, { color: t.muted }]}>Drop-off</Text>
                  <Text style={[styles.legLabel, { color: t.primary }]}>{trip.dropoffLabel}</Text>
                </View>
              </View>
            </View>

            {error ? <Text style={[styles.body, { color: t.muted }]}>{error}</Text> : null}

            {step ? (
              <Pressable
                disabled={busy}
                onPress={() => void advance()}
                style={({ pressed }) => [
                  styles.cta,
                  { backgroundColor: t.signal, opacity: busy ? 0.6 : pressed ? 0.9 : 1 },
                ]}
              >
                {busy ? (
                  <ActivityIndicator color={t.onSignal} />
                ) : (
                  <Text style={[styles.ctaText, { color: t.onSignal }]}>{step.cta}</Text>
                )}
              </Pressable>
            ) : (
              <Text style={[styles.body, { color: t.muted }]}>
                This trip is {STATUS_LABEL[trip.status]?.toLowerCase() ?? trip.status}.
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { gap: 20, padding: 24 },
  status: { fontFamily: 'Inter_700Bold', fontSize: 26, letterSpacing: -0.8 },
  card: { borderRadius: 16, borderWidth: 1, gap: 8, padding: 20 },
  cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  leg: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  dot: { borderRadius: 999, height: 10, width: 10 },
  rail: { height: 20, marginLeft: 4, width: 2 },
  legText: { flex: 1, gap: 2 },
  legEyebrow: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  legLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22 },
  cta: { alignItems: 'center', borderRadius: 14, justifyContent: 'center', minHeight: 58 },
  ctaText: { fontFamily: 'Inter_700Bold', fontSize: 17, letterSpacing: -0.3 },
  retry: { marginTop: 8 },
  retryText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
});
