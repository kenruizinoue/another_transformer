import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

/**
 * Settings screen. The transcription engine selector is added in a later ticket;
 * for now it shows app information so the tab is real, not a placeholder.
 */
export default function SettingsScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ThemedText type="subtitle" style={styles.heading}>
          Settings
        </ThemedText>

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
  },
});
