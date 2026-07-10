import { Link } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

/**
 * Home screen: the list of saved recordings. Real data is wired in a later
 * ticket; for now it shows the empty state so the first screen is the usable
 * app rather than a splash or marketing screen.
 */
export default function RecordingsScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ThemedText type="subtitle" style={styles.heading}>
          Recordings
        </ThemedText>

        <ThemedView style={styles.emptyState} testID="recordings-empty">
          <ThemedText type="default" style={styles.emptyTitle}>
            No recordings yet
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.emptyHint}>
            Record audio to get started. Your recordings will appear here, ready to
            play back and transcribe.
          </ThemedText>
        </ThemedView>

        <Link href="/record" asChild>
          <Pressable testID="new-recording" style={styles.recordButton}>
            <ThemedText type="smallBold">Record</ThemedText>
          </Pressable>
        </Link>
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  emptyTitle: {
    fontWeight: '600',
  },
  emptyHint: {
    textAlign: 'center',
    maxWidth: 320,
  },
  recordButton: {
    alignSelf: 'center',
    marginBottom: Spacing.four,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.six,
    borderRadius: Spacing.five,
    backgroundColor: '#e5484d',
  },
});
