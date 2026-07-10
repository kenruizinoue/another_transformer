import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Recording } from '@/lib/domain';
import { formatDuration } from '@/lib/utils/format-duration';
import { formatTimestamp } from '@/lib/utils/recording-title';

export function RecordingRow({
  recording,
  onPress,
}: {
  recording: Recording;
  onPress?: () => void;
}) {
  return (
    <Pressable
      testID={`recording-row-${recording.id}`}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type="backgroundElement" style={styles.row}>
        <ThemedText type="default" numberOfLines={1}>
          {recording.title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatTimestamp(recording.createdAt)}
          {'  '}
          {formatDuration(recording.durationMs)}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  pressed: {
    opacity: 0.7,
  },
});
