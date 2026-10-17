import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { TranscribeStatus } from '@/hooks/use-transcribe';
import { useTranscriptActions } from '@/hooks/use-transcript-actions';
import type { Recording, TranscriptionEngine } from '@/lib/domain';

// Human-readable engine + model attribution. Keep in sync with the adapters:
// openai-transcriber MODEL and the whisper ggml-base model file.
const ENGINE_LABELS: Record<TranscriptionEngine, string> = {
  apple: 'Apple Speech (on-device)',
  whisper: 'Whisper base (on-device)',
  openai: 'OpenAI gpt-4o-mini-transcribe (cloud)',
};

/**
 * The transcript block of the recording detail screen: transcription progress
 * and error states, the stored transcript, and copy and PDF export. The
 * transcribe action itself lives in the screen's action row.
 */
export function TranscriptSection({
  recording,
  status,
  errorDetail,
}: {
  recording: Recording;
  status: TranscribeStatus;
  errorDetail?: string | null;
}) {
  const { transcript, copied, copy, exportPdf, exportStatus } = useTranscriptActions(recording);

  return (
    <ThemedView style={styles.section}>
      {status === 'transcribing' && (
        <ThemedView style={styles.state} testID="transcribing">
          <ActivityIndicator />
        </ThemedView>
      )}

      {status === 'error' && (
        <>
          <ThemedText type="small" themeColor="textSecondary" testID="transcribe-error">
            Could not transcribe. Check your engine in Settings and try again.
          </ThemedText>
          {errorDetail && (
            <ThemedText type="small" themeColor="textSecondary" testID="transcribe-error-detail">
              {errorDetail}
            </ThemedText>
          )}
        </>
      )}

      {transcript && (
        <>
          <ThemedText type="default" testID="transcript" style={styles.transcript}>
            {transcript}
          </ThemedText>
          {recording.transcriptEngine && (
            <ThemedText type="small" themeColor="textSecondary" testID="engine-badge">
              via {ENGINE_LABELS[recording.transcriptEngine]}
            </ThemedText>
          )}
          <View style={styles.actions}>
            <Button testID="copy" label={copied ? 'Copied' : 'Copy'} onPress={copy} />
            <Button
              testID="export-pdf"
              label="Export PDF"
              onPress={exportPdf}
              disabled={exportStatus === 'exporting'}
            />
          </View>
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  state: {
    paddingVertical: Spacing.two,
  },
  transcript: {
    lineHeight: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
});
