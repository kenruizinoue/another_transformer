import { useRouter } from 'expo-router';
import { Linking, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Accent, Spacing } from '@/constants/theme';
import { useRecorder } from '@/hooks/use-recorder';
import { useRecordingPermission } from '@/hooks/use-recording-permission';
import { useRecordingStore } from '@/lib/store-context';
import { formatDuration } from '@/lib/utils/format-duration';

export default function RecordScreen() {
  const router = useRouter();
  const store = useRecordingStore();
  const { status, request } = useRecordingPermission();
  const { isRecording, elapsedMs, start, stop } = useRecorder(store);

  if (status === 'denied') {
    return (
      <Centered testID="record-denied">
        <ThemedText type="subtitle">Microphone off</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
          another_transformer needs microphone access to record. Enable it in
          Settings.
        </ThemedText>
        <Button
          testID="open-settings"
          label="Open Settings"
          onPress={() => Linking.openSettings()}
        />
      </Centered>
    );
  }

  if (status === 'undetermined') {
    return (
      <Centered testID="record-request">
        <ThemedText type="subtitle">Ready to record</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
          Allow microphone access to start recording.
        </ThemedText>
        <Button testID="allow-microphone" label="Allow microphone" onPress={request} />
      </Centered>
    );
  }

  const onToggle = async () => {
    if (isRecording) {
      await stop();
      router.back();
    } else {
      await start();
    }
  };

  return (
    <Centered testID="record-ready">
      <ThemedText type="title" testID="record-elapsed">
        {formatDuration(elapsedMs)}
      </ThemedText>
      <Pressable
        testID="record-toggle"
        onPress={onToggle}
        style={[styles.recordButton, isRecording && styles.recordButtonActive]}>
        <ThemedText type="smallBold">{isRecording ? 'Stop' : 'Record'}</ThemedText>
      </Pressable>
    </Centered>
  );
}

function Centered({ children, testID }: { children: React.ReactNode; testID?: string }) {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea} testID={testID}>
        {children}
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
    paddingHorizontal: Spacing.four,
  },
  center: {
    textAlign: 'center',
    maxWidth: 320,
  },
  // The record control is a circle, deliberately distinct from the pill Button.
  recordButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Accent.danger,
  },
  recordButtonActive: {
    backgroundColor: '#6E6E73',
  },
});
