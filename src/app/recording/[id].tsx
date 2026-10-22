import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AudioPlayer } from '@/components/audio-player';
import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TranscriptSection } from '@/components/transcript-section';
import { WAVEFORM_BARS } from '@/components/waveform';
import { Spacing } from '@/constants/theme';
import { usePlayback, type Playback } from '@/hooks/use-playback';
import { useRecording } from '@/hooks/use-recording';
import { useTheme } from '@/hooks/use-theme';
import { useTranscribe } from '@/hooks/use-transcribe';
import { useTranscribeLanguage } from '@/hooks/use-transcribe-language';
import { useTranscribePreference } from '@/hooks/use-transcribe-preference';
import { useWaveform } from '@/hooks/use-waveform';
import { TRANSCRIBE_LANGUAGES, type Recording, type TranscriptionEngine } from '@/lib/domain';
import { formatDuration } from '@/lib/utils/format-duration';
import { formatTimestamp } from '@/lib/utils/recording-title';

const ENGINE_NAMES: Record<TranscriptionEngine, string> = {
  apple: 'Apple Speech',
  whisper: 'Whisper',
  openai: 'OpenAI',
};

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
      <SafeAreaView edges={['bottom']} style={styles.container}>
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
  const [draft, setDraft] = useState(recording.title);
  const peaks = useWaveform(recording.fileUri, WAVEFORM_BARS);
  const { preference } = useTranscribePreference();
  const { language } = useTranscribeLanguage();
  const { status: transcribeStatus, errorDetail, run: transcribe } = useTranscribe(onTranscribed);
  const languageName = TRANSCRIBE_LANGUAGES.find((option) => option.tag === language)?.label ?? language;

  // The title saves when editing ends, like a note title. A blank title is
  // not allowed, so the field puts the stored one back.
  const commitTitle = () => {
    const title = draft.trim();
    if (!title) {
      setDraft(recording.title);
    } else if (title !== recording.title) {
      onRename(title);
    }
  };

  const confirmDelete = () =>
    Alert.alert(
      'Delete this recording?',
      'The audio and its transcript are removed from this phone. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ],
    );

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      testID="detail-loaded">
      <View style={styles.titleBlock}>
        <View style={styles.titleRow}>
          <TextInput
            testID="rename-input"
            value={draft}
            onChangeText={setDraft}
            onEndEditing={commitTitle}
            multiline
            submitBehavior="blurAndSubmit"
            returnKeyType="done"
            style={[styles.titleInput, { color: theme.text }]}
            placeholder="Recording title"
            placeholderTextColor={theme.textSecondary}
            accessibilityLabel="Recording title"
          />
          <Icon name="pencil" size={16} color={theme.textSecondary} />
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {formatTimestamp(recording.createdAt)} · {formatDuration(recording.durationMs)}
        </ThemedText>
      </View>

      <AudioPlayer
        positionMs={playback.positionMs}
        durationMs={recording.durationMs || playback.durationMs}
        isPlaying={playback.isPlaying}
        peaks={peaks}
        onToggle={playback.toggle}
        onSeek={playback.seekTo}
      />

      <TranscriptSection
        recording={recording}
        status={transcribeStatus}
        errorDetail={errorDetail}
        hint={`${ENGINE_NAMES[preference]}, ${languageName}. Change in Settings.`}
        onTranscribe={() => transcribe(recording)}
      />

      <Button
        testID="delete"
        label="Delete recording"
        icon="trash"
        variant="dangerTinted"
        onPress={confirmDelete}
        style={styles.delete}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    gap: Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
  },
  titleBlock: {
    gap: Spacing.one,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  titleInput: {
    flex: 1,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    padding: 0,
  },
  delete: {
    alignSelf: 'center',
    marginTop: Spacing.two,
  },
});
