import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTranscribePreference } from '@/hooks/use-transcribe-preference';
import type { TranscriptionEngine } from '@/lib/domain';

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
                onPress={() => setPreference(engine.key)}>
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
                </ThemedView>
              </Pressable>
            );
          })}
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
});
