import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { RecordingRow } from '@/components/recording-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useRecordings } from '@/hooks/use-recordings';

export default function RecordingsScreen() {
  const router = useRouter();
  const { status, recordings, reload } = useRecordings();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ThemedText type="subtitle" style={styles.heading}>
          Recordings
        </ThemedText>

        {status === 'loading' && (
          <ThemedView style={styles.centered} testID="recordings-loading">
            <ActivityIndicator />
          </ThemedView>
        )}

        {status === 'error' && (
          <ThemedView style={styles.centered} testID="recordings-error">
            <ThemedText type="default" style={styles.emptyTitle}>
              Could not load recordings
            </ThemedText>
            <Button testID="recordings-retry" label="Try again" onPress={reload} />
          </ThemedView>
        )}

        {status === 'loaded' && recordings.length === 0 && (
          <ThemedView style={styles.centered} testID="recordings-empty">
            <ThemedText type="default" style={styles.emptyTitle}>
              No recordings yet
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyHint}>
              Record audio to get started. Your recordings will appear here, ready to
              play back and transcribe.
            </ThemedText>
          </ThemedView>
        )}

        {status === 'loaded' && recordings.length > 0 && (
          <FlatList
            testID="recordings-list"
            data={recordings}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <RecordingRow
                recording={item}
                onPress={() => router.push(`/recording/${item.id}`)}
              />
            )}
            contentContainerStyle={styles.listContent}
          />
        )}

        <Button
          testID="new-recording"
          label="Record"
          variant="danger"
          onPress={() => router.push('/record')}
          style={styles.recordButton}
        />
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
  centered: {
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
  listContent: {
    gap: Spacing.two,
    paddingBottom: Spacing.three,
  },
  recordButton: {
    alignSelf: 'center',
    // Clear the floating native tab bar so the button stays tappable.
    marginBottom: BottomTabInset + Spacing.four,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.six,
  },
});
