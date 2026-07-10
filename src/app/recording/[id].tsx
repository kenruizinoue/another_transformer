import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AudioPlayer } from '@/components/audio-player';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { usePlayback } from '@/hooks/use-playback';
import { useRecording } from '@/hooks/use-recording';

export default function RecordingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { status, recording } = useRecording(id);
  const playback = usePlayback(recording?.fileUri ?? null);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        {status === 'loading' && (
          <ThemedView style={styles.centered} testID="detail-loading">
            <ActivityIndicator />
          </ThemedView>
        )}

        {status === 'notfound' && (
          <ThemedView style={styles.centered} testID="detail-notfound">
            <ThemedText type="default">Recording not found</ThemedText>
          </ThemedView>
        )}

        {status === 'loaded' && recording && (
          <ThemedView style={styles.content} testID="detail-loaded">
            <ThemedText type="subtitle" numberOfLines={2}>
              {recording.title}
            </ThemedText>
            <AudioPlayer
              isPlaying={playback.isPlaying}
              positionMs={playback.positionMs}
              durationMs={recording.durationMs || playback.durationMs}
              onToggle={playback.toggle}
              onSeek={playback.seekTo}
            />
          </ThemedView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    gap: Spacing.four,
  },
});
