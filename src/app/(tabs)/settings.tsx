import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Snackbar } from '@/components/snackbar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTranscribePreference } from '@/hooks/use-transcribe-preference';
import { useWhisperModel } from '@/hooks/use-whisper-model';
import type { TranscriptionEngine } from '@/lib/domain';
import { getOpenAiApiKey } from '@/lib/env';

const ENGINES: { key: TranscriptionEngine; label: string; hint: string }[] = [
  { key: 'apple', label: 'On-device (Apple)', hint: 'Free, offline, private. Default.' },
  {
    key: 'whisper',
    label: 'On-device (Whisper)',
    hint: 'Best local quality, one-time model download.',
  },
  { key: 'openai', label: 'Cloud (OpenAI)', hint: 'Uses your OpenAI API key.' },
];

export default function SettingsScreen() {
  const { preference, setPreference } = useTranscribePreference();
  const whisper = useWhisperModel();
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const selectEngine = (engine: TranscriptionEngine) => {
    // Resolve the key at selection time so a doomed choice is called out
    // immediately instead of failing silently at transcribe time.
    if (engine === 'openai' && getOpenAiApiKey() === null) {
      setSnackbar(
        'No API key was baked into this build. On-device engines will be used instead.',
      );
    }
    setPreference(engine);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ThemedText type="subtitle" style={styles.heading}>
          Settings
        </ThemedText>

        <ThemedView style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            TRANSCRIPTION ENGINE
          </ThemedText>
          {ENGINES.map((engine) => {
            const selected = preference === engine.key;
            return (
              <Pressable
                key={engine.key}
                testID={`engine-${engine.key}`}
                accessibilityState={{ selected }}
                onPress={() => selectEngine(engine.key)}>
                <ThemedView
                  type={selected ? 'backgroundSelected' : 'backgroundElement'}
                  style={styles.engineRow}>
                  <ThemedText type="default">
                    {selected ? '✓ ' : ''}
                    {engine.label}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {engine.hint}
                  </ThemedText>
                  {engine.key === 'whisper' && whisper.status === 'not-downloaded' && (
                    <ThemedText
                      type="small"
                      themeColor="textSecondary"
                      testID="whisper-missing-hint">
                      Model not downloaded yet; Apple Speech is used until it is.
                    </ThemedText>
                  )}
                  {engine.key === 'openai' && getOpenAiApiKey() === null && (
                    <ThemedText
                      type="small"
                      themeColor="textSecondary"
                      testID="openai-key-hint">
                      No API key was set when this build was made; on-device engines
                      are used instead.
                    </ThemedText>
                  )}
                </ThemedView>
              </Pressable>
            );
          })}
        </ThemedView>

        <ThemedView style={styles.section} testID="whisper-model-section">
          <ThemedText type="smallBold" themeColor="textSecondary">
            WHISPER MODEL
          </ThemedText>

          {whisper.status === 'checking' && (
            <ThemedText type="small" themeColor="textSecondary">
              Checking...
            </ThemedText>
          )}

          {whisper.status === 'not-downloaded' && (
            <View style={styles.modelRow}>
              <ThemedText type="small" themeColor="textSecondary">
                Not downloaded (about 57 MB, one time)
              </ThemedText>
              <Button testID="whisper-download" label="Download" onPress={whisper.download} />
            </View>
          )}

          {whisper.status === 'downloading' && (
            <ThemedText type="small" themeColor="textSecondary" testID="whisper-progress">
              Downloading... {Math.round(whisper.progress * 100)}%
            </ThemedText>
          )}

          {whisper.status === 'error' && (
            <View style={styles.modelRow}>
              <ThemedText type="small" themeColor="textSecondary" testID="whisper-error">
                Download failed. Check your connection.
              </ThemedText>
              <Button testID="whisper-retry" label="Retry" onPress={whisper.download} />
            </View>
          )}

          {whisper.status === 'ready' && (
            <View style={styles.modelRow}>
              <ThemedText type="small" themeColor="textSecondary" testID="whisper-ready">
                Ready for offline transcription
              </ThemedText>
              <Button
                testID="whisper-delete"
                label="Delete model"
                variant="danger"
                onPress={whisper.remove}
              />
            </View>
          )}
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            ABOUT
          </ThemedText>
          <ThemedText type="default">another_transformer</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Record audio, even while your iPhone is locked, then transcribe it to
            text you can copy or export as a PDF.
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
      <Snackbar message={snackbar} onDismiss={() => setSnackbar(null)} />
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
  },
  heading: {
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
  },
  section: {
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  engineRow: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  modelRow: {
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
});
