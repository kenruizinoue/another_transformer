import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Waveform } from '@/components/waveform';
import { Accent, OnAccent, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDuration } from '@/lib/utils/format-duration';

const SKIP_MS = 5_000;

export type AudioPlayerProps = {
  positionMs: number;
  durationMs: number;
  isPlaying: boolean;
  /** Waveform bars from 0 to 1, or null while they load. */
  peaks: number[] | null;
  onToggle: () => void;
  onSeek: (ms: number) => void;
};

/**
 * The player card: a waveform that is also the seek bar, elapsed and total
 * time, and play or pause between 5 second skips.
 */
export function AudioPlayer({ positionMs, durationMs, isPlaying, peaks, onToggle, onSeek }: AudioPlayerProps) {
  const theme = useTheme();
  const position = Math.min(positionMs, durationMs);
  const progress = durationMs > 0 ? position / durationMs : 0;
  const skip = (deltaMs: number) => onSeek(Math.min(Math.max(position + deltaMs, 0), durationMs));

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <Waveform
        testID="player-scrub"
        peaks={peaks}
        progress={progress}
        onSeek={(fraction) => onSeek(Math.round(fraction * durationMs))}
      />
      <View style={styles.times}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.time}>
          {formatDuration(position)}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.time}>
          {formatDuration(durationMs)}
        </ThemedText>
      </View>
      <View style={styles.controls}>
        <SkipButton testID="player-back" icon="gobackward.5" label="Back 5 seconds" onPress={() => skip(-SKIP_MS)} color={theme.text} />
        <Pressable
          testID="player-toggle"
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
          onPress={onToggle}
          style={({ pressed }) => [styles.play, pressed && styles.pressed]}>
          <Icon name={isPlaying ? 'pause.fill' : 'play.fill'} size={26} color={OnAccent} />
        </Pressable>
        <SkipButton testID="player-forward" icon="goforward.5" label="Forward 5 seconds" onPress={() => skip(SKIP_MS)} color={theme.text} />
      </View>
    </ThemedView>
  );
}

function SkipButton({
  testID,
  icon,
  label,
  onPress,
  color,
}: {
  testID: string;
  icon: IconName;
  label: string;
  onPress: () => void;
  color: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={Spacing.two}
      style={({ pressed }) => [styles.skip, pressed && styles.pressed]}>
      <Icon name={icon} size={26} color={color} weight="medium" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    padding: Spacing.three,
    paddingTop: Spacing.four,
    gap: Spacing.two,
  },
  times: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  time: {
    fontVariant: ['tabular-nums'],
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.five,
  },
  play: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Accent.primary,
  },
  skip: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
