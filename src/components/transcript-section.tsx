import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Accent, AccentTint, Radius, Spacing } from '@/constants/theme';
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
 * The transcript card of the recording detail screen: a transcribe call to
 * action until there is text, progress and error states, then the stored
 * transcript with copy, PDF export and transcribe again.
 */
export function TranscriptSection({
  recording,
  status,
  errorDetail,
  hint,
  onTranscribe,
}: {
  recording: Recording;
  status: TranscribeStatus;
  errorDetail?: string | null;
  /** Which engine and language a transcription will use. */
  hint: string;
  onTranscribe: () => void;
}) {
  const { transcript, copied, copy, exportPdf, exportStatus } = useTranscriptActions(recording);
  const busy = status === 'transcribing';

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.header}>
        <Icon name="text.quote" size={17} color={Accent.primary} />
        <ThemedText type="smallBold">Transcript</ThemedText>
      </View>

      {busy && (
        <View style={styles.busy} testID="transcribing">
          <ActivityIndicator />
          <ThemedText type="small" themeColor="textSecondary">
            Transcribing...
          </ThemedText>
        </View>
      )}

      {status === 'error' && (
        <View style={styles.error}>
          <ThemedText type="small" style={styles.errorText} testID="transcribe-error">
            Could not transcribe. Check your engine in Settings and try again.
          </ThemedText>
          {errorDetail && (
            <ThemedText type="small" themeColor="textSecondary" testID="transcribe-error-detail">
              {errorDetail}
            </ThemedText>
          )}
        </View>
      )}

      {transcript && !busy && (
        <>
          <ThemedText type="default" testID="transcript" style={styles.transcript} selectable>
            {transcript}
          </ThemedText>
          {recording.transcriptEngine && (
            <ThemedText type="small" themeColor="textSecondary" testID="engine-badge">
              via {ENGINE_LABELS[recording.transcriptEngine]}
            </ThemedText>
          )}
          <View style={styles.actions}>
            <Button
              testID="copy"
              label={copied ? 'Copied' : 'Copy'}
              icon={copied ? 'checkmark' : 'doc.on.doc'}
              variant="secondary"
              onPress={copy}
            />
            <Button
              testID="export-pdf"
              label="PDF"
              icon="square.and.arrow.up"
              variant="secondary"
              onPress={exportPdf}
              disabled={exportStatus === 'exporting'}
            />
            <Button
              testID="transcribe"
              label="Redo"
              icon="arrow.clockwise"
              variant="secondary"
              onPress={onTranscribe}
            />
          </View>
        </>
      )}

      {!transcript && !busy && (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            Turn this recording into text you can copy or share.
          </ThemedText>
          <Button testID="transcribe" label="Transcribe" icon="waveform" size="large" onPress={onTranscribe} />
        </>
      )}

      <ThemedText type="small" themeColor="textSecondary" style={styles.hint} testID="transcribe-hint">
        {hint}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  busy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
  },
  error: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Radius.control,
    backgroundColor: AccentTint.danger,
  },
  errorText: {
    color: Accent.danger,
  },
  transcript: {
    fontSize: 17,
    lineHeight: 26,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  hint: {
    textAlign: 'center',
  },
});
