import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { RecordingRow } from '@/components/recording-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Accent, AccentTint, BottomTabInset, Spacing } from '@/constants/theme';
import { useRecordings } from '@/hooks/use-recordings';

export default function RecordingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { status, recordings, reload } = useRecordings();
  // Clear the floating native tab pill, which sits above the home indicator:
  // safe-area bottom + pill height + breathing room.
  const tabClearance = insets.bottom + BottomTabInset + Spacing.four;

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
            <View style={styles.emptyBadge}>
              <Icon name="waveform" size={36} color={Accent.primary} />
            </View>
            <ThemedText type="default" style={styles.emptyTitle}>
              No recordings yet
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyHint}>
              Tap Record to capture a meeting, a lecture or an idea. Then play it back and turn
              it into text.
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
            contentContainerStyle={[styles.listContent, { paddingBottom: tabClearance }]}
          />
        )}

        <Button
          testID="new-recording"
          label="Record"
          icon="mic.fill"
          size="large"
          variant="danger"
          onPress={() => router.push('/record')}
          style={[styles.recordButton, { marginBottom: tabClearance }]}
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
  emptyBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AccentTint.primary,
    marginBottom: Spacing.two,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
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
    marginTop: Spacing.three,
  },
});
