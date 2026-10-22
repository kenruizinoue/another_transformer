import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Accent, AccentTint, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
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
  const theme = useTheme();
  const meta = `${formatTimestamp(recording.createdAt)} · ${formatDuration(recording.durationMs)}`;

  return (
    <Pressable
      testID={`recording-row-${recording.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${recording.title}, ${meta}${recording.transcript ? ', transcribed' : ''}`}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type="backgroundElement" style={styles.row}>
        <View style={styles.tile}>
          <Icon name="waveform" size={20} color={Accent.primary} />
        </View>
        <View style={styles.text}>
          <ThemedText type="default" numberOfLines={1} style={styles.title}>
            {recording.title}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.meta}>
            {meta}
          </ThemedText>
        </View>
        {recording.transcript && <Icon name="text.quote" size={15} color={theme.textSecondary} />}
        <Icon name="chevron.right" size={14} color={theme.textSecondary} />
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.card,
  },
  tile: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AccentTint.primary,
  },
  text: {
    flex: 1,
    gap: Spacing.half,
  },
  title: {
    fontWeight: '600',
  },
  meta: {
    fontVariant: ['tabular-nums'],
  },
  pressed: {
    opacity: 0.7,
  },
});
