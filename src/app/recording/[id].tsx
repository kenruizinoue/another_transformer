import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AudioPlayer } from '@/components/audio-player';
import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TranscriptSection } from '@/components/transcript-section';
import { Spacing } from '@/constants/theme';
import { usePlayback, type Playback } from '@/hooks/use-playback';
import { useRecording } from '@/hooks/use-recording';
import { useTheme } from '@/hooks/use-theme';
import { useTranscribe } from '@/hooks/use-transcribe';
import type { Recording } from '@/lib/domain';

export default function RecordingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { status, recording, reload, rename, remove } = useRecording(id);
  const playback = usePlayback(recording?.fileUri ?? null);

  const onDelete = async () => {
    playback.pause();
    await remove();
    router.back();
  };

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
          <DetailContent
            recording={recording}
            playback={playback}
            onRename={rename}
            onDelete={onDelete}
            onTranscribed={reload}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

function DetailContent({
  recording,
  playback,
  onRename,
  onDelete,
  onTranscribed,
}: {
  recording: Recording;
  playback: Playback;
  onRename: (title: string) => Promise<boolean>;
  onDelete: () => void;
  onTranscribed: () => void;
}) {
  const theme = useTheme();
  const draftTitle = useRef(recording.title);
  const { status: transcribeStatus, errorDetail, run: transcribe } = useTranscribe(onTranscribed);

  return (
    <ScrollView contentContainerStyle={styles.content} testID="detail-loaded">
      <TextInput
        testID="rename-input"
        defaultValue={recording.title}
        onChangeText={(text) => {
          draftTitle.current = text;
        }}
        style={[styles.titleInput, { color: theme.text, borderColor: theme.backgroundElement }]}
        placeholder="Recording title"
        placeholderTextColor={theme.textSecondary}
      />
      <Button
        testID="rename-save"
        label="Save name"
        onPress={() => onRename(draftTitle.current)}
      />

      <AudioPlayer
        positionMs={playback.positionMs}
        durationMs={recording.durationMs || playback.durationMs}
        onSeek={playback.seekTo}
      />

      <View style={styles.actionRow}>
        <Button
          testID="player-toggle"
          label={playback.isPlaying ? 'Pause' : 'Play'}
          onPress={playback.toggle}
        />
        <Button
          testID="transcribe"
          label={recording.transcript ? 'Transcribe again' : 'Transcribe'}
          onPress={() => transcribe(recording)}
          disabled={transcribeStatus === 'transcribing'}
        />
        <Button testID="delete" label="Delete" variant="danger" onPress={onDelete} />
      </View>

      <TranscriptSection
        recording={recording}
        status={transcribeStatus}
        errorDetail={errorDetail}
      />
    </ScrollView>
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
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: '600',
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
