import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { MrDafoe_400Regular } from '@expo-google-fonts/mr-dafoe';
import { hocColors } from '@hoc/design-tokens';
import type { Session } from '@supabase/supabase-js';
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  useRouter,
  useSegments,
  type Theme,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import '@/lib/location'; // registers the background location task at app entry
import { supabase } from '@/lib/supabase';

void SplashScreen.preventAutoHideAsync();

const lightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: hocColors.light.canvas,
    border: hocColors.light.border,
    card: hocColors.light.surface,
    notification: hocColors.signal,
    primary: hocColors.light.primary,
    text: hocColors.light.primary,
  },
};

const darkTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: hocColors.dark.canvas,
    border: hocColors.dark.border,
    card: hocColors.dark.surface,
    notification: hocColors.signal,
    primary: hocColors.dark.primary,
    text: hocColors.dark.primary,
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    MrDafoe_400Regular,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  const ready = (fontsLoaded || fontError) && session !== undefined;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  // Route gate: signed-out users are held in (auth); signed-in users are kept
  // out of it.
  useEffect(() => {
    if (!ready) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/sign-in');
    } else if (session && inAuthGroup) {
      router.replace('/');
    }
  }, [ready, session, segments, router]);

  if (!ready) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? darkTheme : lightTheme}>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
