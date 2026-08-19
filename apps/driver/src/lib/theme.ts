import { hocColors } from '@hoc/design-tokens';
import { useColorScheme } from 'react-native';

/**
 * Resolves the HOC palette for the current colour scheme and adds a couple of
 * derived tones the raw tokens don't carry (a muted text colour, the signal
 * pair). Keeps every driver screen on the locked monochrome + Guards-Red system.
 */
export function useTheme() {
  const isDark = useColorScheme() === 'dark';
  const base = isDark ? hocColors.dark : hocColors.light;
  return {
    isDark,
    canvas: base.canvas,
    surface: base.surface,
    frosted: base.frosted,
    border: base.border,
    primary: base.primary,
    muted: isDark ? 'hsla(225, 100%, 99%, 0.6)' : 'hsla(225, 66.7%, 1.2%, 0.56)',
    signal: hocColors.signal,
    onSignal: hocColors.onSignal,
  };
}

export type Theme = ReturnType<typeof useTheme>;
