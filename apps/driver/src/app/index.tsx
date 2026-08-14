import { hocColors } from '@hoc/design-tokens';
import { Image, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const isDark = useColorScheme() === 'dark';
  const palette = isDark ? hocColors.dark : hocColors.light;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: palette.canvas }]}
    >
      <View style={styles.content}>
        <Image
          accessibilityLabel="HOC"
          resizeMode="contain"
          source={require('../../assets/images/hoc-logo.png')}
          style={styles.logo}
        />
        <View style={styles.copy}>
          <Text style={[styles.eyebrow, { color: palette.primary }]}>HOC Elite Wheels</Text>
          <Text style={[styles.heading, { color: palette.primary }]}>Driver foundation</Text>
          <Text style={[styles.body, { color: palette.primary }]}>Mobile surface scaffold</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 26,
    opacity: 0.64,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  copy: {
    gap: 12,
  },
  eyebrow: {
    fontFamily: 'MrDafoe_400Regular',
    fontSize: 34,
    letterSpacing: -0.8,
    lineHeight: 42,
  },
  heading: {
    fontFamily: 'Inter_700Bold',
    fontSize: 48,
    letterSpacing: -2.2,
    lineHeight: 48,
  },
  logo: {
    height: 64,
    width: 70,
  },
  safeArea: {
    flex: 1,
  },
});
