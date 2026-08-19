import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';

export default function SignInScreen() {
  const palette = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setBusy(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError) setError(signInError.message);
    setBusy(false);
    // On success, onAuthStateChange in the root layout redirects to the app.
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.canvas }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.content}>
          <View>
            <Text style={[styles.eyebrow, { color: palette.muted }]}>HOC Elite Wheels</Text>
            <Text style={[styles.heading, { color: palette.primary }]}>Driver sign in</Text>
            <Text style={[styles.sub, { color: palette.muted }]}>
              Sign in with the account your fleet set up for you.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: palette.muted }]}>Email</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                inputMode="email"
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={palette.muted}
                style={[styles.input, { borderColor: palette.border, color: palette.primary }]}
                value={email}
              />
            </View>
            <View style={styles.field}>
              <Text style={[styles.label, { color: palette.muted }]}>Password</Text>
              <TextInput
                autoCapitalize="none"
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={palette.muted}
                secureTextEntry
                style={[styles.input, { borderColor: palette.border, color: palette.primary }]}
                value={password}
              />
            </View>

            {error ? <Text style={[styles.error, { color: palette.signal }]}>{error}</Text> : null}

            <Pressable
              disabled={busy || !email || !password}
              onPress={signIn}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: palette.signal, opacity: busy || !email || !password ? 0.5 : pressed ? 0.85 : 1 },
              ]}
            >
              {busy ? (
                <ActivityIndicator color={palette.onSignal} />
              ) : (
                <Text style={[styles.buttonText, { color: palette.onSignal }]}>Sign in</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', gap: 40, paddingHorizontal: 24 },
  eyebrow: { fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' },
  heading: { fontFamily: 'Inter_700Bold', fontSize: 40, letterSpacing: -1.5, marginTop: 12 },
  sub: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22, marginTop: 10, maxWidth: 320 },
  form: { gap: 18 },
  field: { gap: 6 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  error: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  button: { alignItems: 'center', borderRadius: 12, justifyContent: 'center', minHeight: 54, marginTop: 4 },
  buttonText: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
});
