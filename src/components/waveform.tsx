import { useState } from 'react';
import { StyleSheet, View, type GestureResponderEvent } from 'react-native';

import { Accent } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export const WAVEFORM_BARS = 48;

const clamp = (value: number) => Math.min(Math.max(value, 0), 1);

/**
 * The recording's loudness as bars that double as the seek bar: played bars
 * take the accent color, and a tap or drag anywhere seeks there. Shows flat
 * bars while the real ones load or when the file cannot be read.
 */
export function Waveform({
  peaks,
  progress,
  onSeek,
  testID,
}: {
  peaks: number[] | null;
  /** Played fraction, 0 to 1. */
  progress: number;
  onSeek: (fraction: number) => void;
  testID?: string;
}) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  // While a finger drags, the bars follow it; the seek happens on release.
  const [scrub, setScrub] = useState<number | null>(null);
  const shown = scrub ?? progress;
  const levels = peaks ?? Array<number>(WAVEFORM_BARS).fill(0.08);
  const at = (event: GestureResponderEvent) => (width ? clamp(event.nativeEvent.locationX / width) : 0);

  return (
    <View
      testID={testID}
      style={styles.wave}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={(event) => setScrub(at(event))}
      onResponderMove={(event) => setScrub(at(event))}
      onResponderRelease={(event) => {
        onSeek(at(event));
        setScrub(null);
      }}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Playback position"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(shown * 100) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) =>
        onSeek(clamp(progress + (event.nativeEvent.actionName === 'increment' ? 0.1 : -0.1)))
      }>
      {levels.map((level, i) => {
        const played = (i + 0.5) / levels.length <= shown;
        return (
          <View
            key={i}
            pointerEvents="none"
            style={[
              styles.bar,
              {
                height: 4 + level * 52,
                backgroundColor: played ? Accent.primary : theme.textSecondary,
                opacity: played ? 1 : 0.35,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wave: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bar: {
    width: 3,
    borderRadius: 2,
  },
});
