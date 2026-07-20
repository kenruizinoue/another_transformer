import Slider from '@react-native-community/slider';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Accent, Spacing } from '@/constants/theme';
import { formatDuration } from '@/lib/utils/format-duration';

export type AudioPlayerProps = {
  positionMs: number;
  durationMs: number;
  onSeek: (ms: number) => void;
};

/**
 * Presentational scrubber: a seek slider with elapsed and total time. The
 * play/pause control lives in the screen's action row, not here.
 */
export function AudioPlayer({ positionMs, durationMs, onSeek }: AudioPlayerProps) {
  return (
    <View style={styles.container}>
      <Slider
        testID="player-scrub"
        minimumValue={0}
        maximumValue={Math.max(durationMs, 1)}
        value={Math.min(positionMs, durationMs)}
        onSlidingComplete={onSeek}
        minimumTrackTintColor={Accent.primary}
      />
      <View style={styles.times}>
        <ThemedText type="small" themeColor="textSecondary">
          {formatDuration(positionMs)}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatDuration(durationMs)}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  times: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
