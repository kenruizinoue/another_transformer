import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTranscribe } from '@/hooks/use-transcribe';
import { useTranscriptActions } from '@/hooks/use-transcript-actions';
import type { Recording } from '@/lib/domain';

/**
 * The transcript block of the recording detail screen: transcribe action with
 * progress and error states, the stored transcript, and copy and PDF export.
 */
export function TranscriptSection({
  recording,
  onTranscribed,
}: {
  recording: Recording;
  onTranscribed: () => void;
}) {
  const { status, run } = useTranscribe(onTranscribed);
  const { transcript, copied, copy, exportPdf, exportStatus } = useTranscriptActions(recording);

  return (
    <ThemedView style={styles.section}>
      <Button
        testID="transcribe"
        label={transcript ? 'Transcribe again' : 'Transcribe'}
        onPress={() => run(recording)}
        disabled={status === 'transcribing'}
      />

      {status === 'transcribing' && (
        <ThemedView style={styles.state} testID="transcribing">
          <ActivityIndicator />
        </ThemedView>
      )}

      {status === 'error' && (
        <ThemedText type="small" themeColor="textSecondary" testID="transcribe-error">
          Could not transcribe. Check your engine in Settings and try again.
        </ThemedText>
      )}

      {transcript && (
        <>
          <ThemedText type="default" testID="transcript" style={styles.transcript}>
            {transcript}
          </ThemedText>
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
