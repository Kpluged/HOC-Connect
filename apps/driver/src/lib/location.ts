import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { api } from './trpc';

/**
 * Location streaming for the driver app. While a driver is online we push their
 * position to the server (`drivers.reportLocation` -> `app.driver_report_location`),
 * which moves them live on the owner's dispatch map and feeds the nearest-driver
 * matcher. Foreground uses a watch subscription; native also registers a
 * background task so location keeps flowing when the app is backgrounded during
 * a trip. Web has no background task (unsupported) — foreground watch only.
 */
export const LOCATION_TASK = 'hoc-driver-location';

const isNative = Platform.OS !== 'web';

// Report a single fix, swallowing transient network/auth errors so a dropped
// update never crashes the watcher or the headless background task.
async function report(lat: number, lng: number, operationalStatus?: 'available' | 'offline') {
  try {
    await api.reportLocation({ lat, lng, ...(operationalStatus ? { operationalStatus } : {}) });
  } catch {
    // best-effort; the next fix will retry
  }
}

// Registered at module load (see _layout import). Native only — defineTask on
// web would register a task the platform can never run.
if (isNative) {
  TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
    if (error || !data) return;
    const { locations } = data as { locations: Location.LocationObject[] };
    const latest = locations?.at(-1);
    if (latest) await report(latest.coords.latitude, latest.coords.longitude);
  });
}

let watcher: Location.LocationSubscription | null = null;

export type PermissionResult = { foreground: boolean; background: boolean };

/**
 * Ask for foreground first, then (native) background. Background is best-effort:
 * a driver can still go online with foreground-only permission, they just stop
 * being tracked once the app is backgrounded.
 */
export async function requestLocationPermissions(): Promise<PermissionResult> {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (!fg.granted) return { foreground: false, background: false };
  if (!isNative) return { foreground: true, background: false };
  try {
    const bg = await Location.requestBackgroundPermissionsAsync();
    return { foreground: true, background: bg.granted };
  } catch {
    return { foreground: true, background: false };
  }
}

/**
 * Start streaming location. Reports the first fix immediately (so the driver
 * appears on the map right away), then on every subsequent watch update. On
 * native it also starts the background task if that permission was granted.
 */
export async function startLocationTracking(background: boolean): Promise<void> {
  const first = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  // First fix flips the driver to `available` so they enter the matching pool.
  await report(first.coords.latitude, first.coords.longitude, 'available');

  watcher?.remove();
  watcher = await Location.watchPositionAsync(
    { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 20 },
    (fix) => void report(fix.coords.latitude, fix.coords.longitude),
  );

  if (isNative && background) {
    const already = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
    if (!already) {
      await Location.startLocationUpdatesAsync(LOCATION_TASK, {
        accuracy: Location.Accuracy.High,
        timeInterval: 8000,
        distanceInterval: 30,
        showsBackgroundLocationIndicator: true,
        pausesUpdatesAutomatically: false,
        foregroundService: {
          notificationTitle: 'HOC Elite Wheels — online',
          notificationBody: 'Sharing your location so dispatch can match you with rides.',
        },
      });
    }
  }
}

/** Stop the watch subscription and (native) the background task. */
export async function stopLocationTracking(): Promise<void> {
  watcher?.remove();
  watcher = null;
  if (isNative) {
    const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
    if (started) await Location.stopLocationUpdatesAsync(LOCATION_TASK).catch(() => undefined);
  }
}

/**
 * Go offline: stop tracking and flip the server status to `offline` (using the
 * last known fix, since the report requires a point). Best-effort — if no fix is
 * available the driver's shift still gates them out of the matcher.
 */
export async function goOffline(): Promise<void> {
  await stopLocationTracking();
  try {
    const last =
      (await Location.getLastKnownPositionAsync()) ??
      (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    if (last) await report(last.coords.latitude, last.coords.longitude, 'offline');
  } catch {
    // no position available; nothing more we can do from the client
  }
}
