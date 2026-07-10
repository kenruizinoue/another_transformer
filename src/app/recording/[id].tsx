import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AudioPlayer } from '@/components/audio-player';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { usePlayback, type Playback } from '@/hooks/use-playback';
import { useRecording } from '@/hooks/use-recording';
import { useTheme } from '@/hooks/use-theme';
import { useTranscribe } from '@/hooks/use-transcribe';
import type { Recording } from '@/lib/domain';

export default function RecordingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { status, recording, rename, remove } = useRecording(id);
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
}: {
  recording: Recording;
  playback: Playback;
  onRename: (title: string) => Promise<boolean>;
  onDelete: () => void;
}) {
  const theme = useTheme();
  const draftTitle = useRef(recording.title);
  const { status: transcribeStatus, transcript, run } = useTranscribe();
  const shownTranscript = transcript ?? recording.transcript ?? null;
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    if (!shownTranscript) return;
    await Clipboard.setStringAsync(shownTranscript);
    setCopied(true);
  };

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
      <Pressable
        testID="rename-save"
        onPress={() => onRename(draftTitle.current)}
        style={styles.saveButton}>
        <ThemedText type="smallBold">Save name</ThemedText>
      </Pressable>

      <AudioPlayer
        isPlaying={playback.isPlaying}
        positionMs={playback.positionMs}
        durationMs={recording.durationMs || playback.durationMs}
        onToggle={playback.toggle}
        onSeek={playback.seekTo}
      />

      <ThemedView style={styles.transcriptSection}>
        <Pressable
          testID="transcribe"
          onPress={() => run(recording)}
          disabled={transcribeStatus === 'transcribing'}
          style={styles.transcribeButton}>
          <ThemedText type="smallBold">
            {shownTranscript ? 'Transcribe again' : 'Transcribe'}
          </ThemedText>
        </Pressable>

        {transcribeStatus === 'transcribing' && (
          <ThemedView style={styles.transcriptState} testID="transcribing">
            <ActivityIndicator />
          </ThemedView>
        )}

        {transcribeStatus === 'error' && (
          <ThemedText type="small" themeColor="textSecondary" testID="transcribe-error">
            Could not transcribe. Check your engine in Settings and try again.
          </ThemedText>
        )}

        {shownTranscript && (
          <>
            <ThemedText type="default" testID="transcript" style={styles.transcript}>
              {shownTranscript}
            </ThemedText>
            <View style={styles.exportRow}>
              <Pressable testID="copy" onPress={onCopy} style={styles.exportButton}>
                <ThemedText type="smallBold">{copied ? 'Copied' : 'Copy'}</ThemedText>
              </Pressable>
            </View>
          </>
        )}
      </ThemedView>

      <Pressable testID="delete" onPress={onDelete} style={styles.deleteButton}>
        <ThemedText type="smallBold">Delete recording</ThemedText>
      </Pressable>
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
  transcriptSection: {
    gap: Spacing.two,
  },
  transcribeButton: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.five,
    backgroundColor: '#3c87f7',
  },
  transcriptState: {
    paddingVertical: Spacing.two,
  },
  transcript: {
    lineHeight: 24,
  },
  exportRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  exportButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.five,
    backgroundColor: '#3c87f7',
  },
  titleInput: {
    fontSize: 20,
    fontWeight: '600',
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  saveButton: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.five,
    backgroundColor: '#3c87f7',
  },
  deleteButton: {
    alignSelf: 'center',
    marginTop: Spacing.four,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.five,
    backgroundColor: '#e5484d',
  },
});
