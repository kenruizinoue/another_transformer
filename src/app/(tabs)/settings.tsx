import Constants from 'expo-constants';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Icon, type IconName } from '@/components/icon';
import { Snackbar } from '@/components/snackbar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Accent, AccentTint, BottomTabInset, OnAccent, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranscribeLanguage } from '@/hooks/use-transcribe-language';
import { useTranscribePreference } from '@/hooks/use-transcribe-preference';
import { useWhisperModel } from '@/hooks/use-whisper-model';
import { TRANSCRIBE_LANGUAGES, type TranscriptionEngine } from '@/lib/domain';
import { getOpenAiApiKey } from '@/lib/env';

const ENGINES: { key: TranscriptionEngine; icon: IconName; label: string; hint: string }[] = [
  { key: 'apple', icon: 'iphone', label: 'Apple Speech', hint: 'On device. Free, offline, private.' },
  { key: 'whisper', icon: 'cpu', label: 'Whisper', hint: 'On device. Best offline quality.' },
  { key: 'openai', icon: 'cloud', label: 'OpenAI', hint: 'Cloud. Uses your OpenAI API key.' },
];

export default function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { preference, setPreference } = useTranscribePreference();
  const { language, setLanguage } = useTranscribeLanguage();
  const whisper = useWhisperModel();
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const hasKey = getOpenAiApiKey() !== null;
  // Clear the floating native tab bar at the bottom of the scroll.
  const tabClearance = insets.bottom + BottomTabInset + Spacing.four;

  const selectEngine = (engine: TranscriptionEngine) => {
    // Whisper without its model can never transcribe: block the selection and
    // point at the download instead of persisting a doomed choice.
    if (engine === 'whisper' && whisper.status !== 'ready') {
      setSnackbar('Download the Whisper model below first, then select this engine.');
      return;
    }
    // Resolve the key at selection time so a doomed choice is called out
    // immediately instead of failing silently at transcribe time.
    if (engine === 'openai' && !hasKey) {
      setSnackbar('No API key was baked into this build. On-device engines will be used instead.');
    }
    setPreference(engine);
  };

  const confirmDeleteModel = () =>
    Alert.alert('Delete the Whisper model?', 'You can download it again any time.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: whisper.remove },
    ]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.container}>
        <ScrollView
          testID="settings-scroll"
          contentContainerStyle={[styles.content, { paddingBottom: tabClearance }]}>
          <ThemedText type="subtitle" style={styles.heading}>
            Settings
          </ThemedText>

          <Section title="Transcription engine">
            <ThemedView type="backgroundElement" style={styles.card}>
              {ENGINES.map((engine, index) => {
                const selected = preference === engine.key;
                const missingModel = engine.key === 'whisper' && whisper.status === 'not-downloaded';
                const missingKey = engine.key === 'openai' && !hasKey;
                return (
                  <Pressable
                    key={engine.key}
                    testID={`engine-${engine.key}`}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    onPress={() => selectEngine(engine.key)}
                    style={({ pressed }) => [
                      styles.engineRow,
                      index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.separator },
                      pressed && styles.pressed,
                    ]}>
                    <IconTile name={engine.icon} />
                    <View style={styles.rowText}>
                      <ThemedText type="default">{engine.label}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {engine.hint}
                      </ThemedText>
                      {missingModel && (
                        <ThemedText type="small" style={styles.warning} testID="whisper-missing-hint">
                          Download the model below first.
                        </ThemedText>
                      )}
                      {missingKey && (
                        <ThemedText type="small" style={styles.warning} testID="openai-key-hint">
                          No API key in this build, so on-device engines are used instead.
                        </ThemedText>
                      )}
                    </View>
                    <Icon
                      name={selected ? 'checkmark.circle.fill' : 'circle'}
                      size={24}
                      color={selected ? Accent.primary : theme.textSecondary}
                      weight="regular"
                    />
                  </Pressable>
                );
              })}
            </ThemedView>
          </Section>

          <Section
            title="Language"
            footer="The language spoken in your recordings. All three engines use it.">
            <ThemedView type="backgroundElement" style={styles.segments}>
              {TRANSCRIBE_LANGUAGES.map((option) => {
                const selected = language === option.tag;
                return (
                  <Pressable
                    key={option.tag}
                    testID={`language-${option.tag}`}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    onPress={() => setLanguage(option.tag)}
                    style={[styles.segment, selected && { backgroundColor: Accent.primary }]}>
                    <ThemedText
                      type="smallBold"
                      style={{ color: selected ? OnAccent : theme.text }}
                      numberOfLines={1}>
                      {option.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ThemedView>
          </Section>

          <Section title="Whisper model">
            <ThemedView type="backgroundElement" style={[styles.card, styles.modelCard]} testID="whisper-model-section">
              <View style={styles.modelHeader}>
                <IconTile name={whisper.status === 'ready' ? 'checkmark.seal.fill' : 'arrow.down.circle'} />
                <View style={styles.rowText}>
                  <ThemedText type="default">Whisper base</ThemedText>
                  {whisper.status === 'checking' && (
                    <ThemedText type="small" themeColor="textSecondary">
                      Checking...
                    </ThemedText>
                  )}
                  {whisper.status === 'not-downloaded' && (
                    <ThemedText type="small" themeColor="textSecondary">
                      Not downloaded yet. 148 MB.
                    </ThemedText>
                  )}
                  {whisper.status === 'downloading' && (
                    <ThemedText type="small" themeColor="textSecondary" testID="whisper-progress">
                      Downloading {Math.round(whisper.progress * 100)}%
                    </ThemedText>
                  )}
                  {whisper.status === 'error' && (
                    <ThemedText type="small" style={styles.warning} testID="whisper-error">
                      Download failed. Check your connection.
                    </ThemedText>
                  )}
                  {whisper.status === 'ready' && (
                    <ThemedText type="small" themeColor="textSecondary" testID="whisper-ready">
                      Ready. Works offline.
                    </ThemedText>
                  )}
                </View>
              </View>

              {whisper.status === 'downloading' && (
                <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
                  <View
                    testID="whisper-progress-bar"
                    style={[styles.fill, { width: `${Math.round(whisper.progress * 100)}%` }]}
                  />
                </View>
              )}
              {whisper.status === 'not-downloaded' && (
                <Button testID="whisper-download" label="Download" icon="arrow.down" onPress={whisper.download} />
              )}
              {whisper.status === 'error' && (
                <Button testID="whisper-retry" label="Try again" icon="arrow.clockwise" onPress={whisper.download} />
              )}
              {whisper.status === 'ready' && (
                <Button
                  testID="whisper-delete"
                  label="Delete model"
                  icon="trash"
                  variant="dangerTinted"
                  onPress={confirmDeleteModel}
                />
              )}
            </ThemedView>
          </Section>

          <Section title="About">
            <ThemedView type="backgroundElement" style={[styles.card, styles.about]}>
              <ThemedText type="default">Another Transformer</ThemedText>
              {Constants.expoConfig?.version && (
                <ThemedText type="small" themeColor="textSecondary">
                  Version {Constants.expoConfig.version}
                </ThemedText>
              )}
              <ThemedText type="small" themeColor="textSecondary">
                Record audio, even while your iPhone is locked, then turn it into text you can copy or
                export as a PDF. Open source under the MIT license.
              </ThemedText>
            </ThemedView>
          </Section>
        </ScrollView>
      </SafeAreaView>
      <Snackbar message={snackbar} onDismiss={() => setSnackbar(null)} />
    </ThemedView>
  );
}

function Section({ title, footer, children }: { title: string; footer?: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
        {title.toUpperCase()}
      </ThemedText>
      {children}
      {footer && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.sectionFooter}>
          {footer}
        </ThemedText>
      )}
    </View>
  );
}

function IconTile({ name }: { name: IconName }) {
  return (
    <View style={styles.iconTile}>
      <Icon name={name} size={18} color={Accent.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  heading: {
    paddingTop: Spacing.four,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: 12,
    letterSpacing: 0.6,
    paddingHorizontal: Spacing.three,
  },
  sectionFooter: {
    paddingHorizontal: Spacing.three,
  },
  card: {
    borderRadius: Radius.card,
    overflow: 'hidden',
  },
  engineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  rowText: {
    flex: 1,
    gap: Spacing.half,
  },
  warning: {
    color: Accent.danger,
  },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AccentTint.primary,
  },
  segments: {
    flexDirection: 'row',
    padding: Spacing.one,
    borderRadius: Radius.control,
    gap: Spacing.one,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.control - Spacing.one,
  },
  modelCard: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  modelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Accent.primary,
  },
  about: {
    padding: Spacing.three,
    gap: Spacing.one,
  },
  pressed: {
    opacity: 0.7,
  },
});
