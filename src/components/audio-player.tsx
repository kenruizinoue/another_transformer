import Slider from '@react-native-community/slider';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Accent, Spacing } from '@/constants/theme';
import { formatDuration } from '@/lib/utils/format-duration';

export type AudioPlayerProps = {
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  onToggle: () => void;
  onSeek: (ms: number) => void;
};

/**
 * Presentational audio player: a scrub slider, elapsed and total time, and a
 * play/pause control. State comes from the usePlayback hook via props.
 */
export function AudioPlayer({ isPlaying, positionMs, durationMs, onToggle, onSeek }: AudioPlayerProps) {
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
      <Button
        testID="player-toggle"
        label={isPlaying ? 'Pause' : 'Play'}
        onPress={onToggle}
        style={styles.toggle}
      />
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
  toggle: {
    alignSelf: 'center',
    paddingHorizontal: Spacing.six,
  },
});
