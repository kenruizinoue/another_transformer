import Slider from '@react-native-community/slider';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
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
        minimumTrackTintColor="#3c87f7"
      />
      <View style={styles.times}>
        <ThemedText type="small" themeColor="textSecondary">
          {formatDuration(positionMs)}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatDuration(durationMs)}
        </ThemedText>
      </View>
      <Pressable testID="player-toggle" onPress={onToggle} style={styles.toggle}>
        <ThemedText type="smallBold">{isPlaying ? 'Pause' : 'Play'}</ThemedText>
      </Pressable>
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
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.six,
    borderRadius: Spacing.five,
    backgroundColor: '#3c87f7',
  },
});
