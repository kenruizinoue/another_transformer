import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Linking, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Icon, type IconName } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Accent, AccentTint, Spacing } from '@/constants/theme';
import { useRecorder } from '@/hooks/use-recorder';
import { useRecordingPermission } from '@/hooks/use-recording-permission';
import { useTheme } from '@/hooks/use-theme';
import { useRecordingStore } from '@/lib/store-context';
import { formatDuration } from '@/lib/utils/format-duration';

export default function RecordScreen() {
  const router = useRouter();
  const store = useRecordingStore();
  const theme = useTheme();
  const { status, request } = useRecordingPermission();
  const { isRecording, elapsedMs, levels, start, stop } = useRecorder(store);

  // Swiping the sheet down mid take would unmount the recorder and lose the
  // audio, so the sheet only closes through Stop while recording.
  const sheetOptions = <Stack.Screen options={{ gestureEnabled: !isRecording }} />;

  if (status === 'denied') {
    return (
      <Message
        testID="record-denied"
        icon="mic.slash.fill"
        title="Microphone off"
        body="Another Transformer needs the microphone to record. Turn it on in Settings.">
        {sheetOptions}
        <Button testID="open-settings" label="Open Settings" onPress={() => Linking.openSettings()} />
      </Message>
    );
  }

  if (status === 'undetermined') {
    return (
      <Message
        testID="record-request"
        icon="mic.fill"
        title="Ready to record"
        body="Allow microphone access to start recording.">
        {sheetOptions}
        <Button testID="allow-microphone" label="Allow microphone" onPress={request} />
      </Message>
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
    <ThemedView style={styles.container}>
      {sheetOptions}
      <SafeAreaView edges={['bottom']} style={styles.recorder} testID="record-ready">
        {isRecording ? (
          <View style={[styles.pill, { backgroundColor: AccentTint.danger }]} testID="record-live">
            <View style={[styles.dot, { backgroundColor: Accent.danger }]} />
            <ThemedText type="smallBold" style={{ color: Accent.danger }}>
              Recording
            </ThemedText>
          </View>
        ) : (
          <View style={[styles.pill, { backgroundColor: theme.backgroundElement }]}>
            <View style={[styles.dot, { backgroundColor: theme.textSecondary }]} />
            <ThemedText type="smallBold" themeColor="textSecondary">
              Ready
            </ThemedText>
          </View>
        )}

        <View style={styles.middle}>
          <ThemedText testID="record-elapsed" style={[styles.timer, { color: theme.text }]}>
            {formatDuration(elapsedMs)}
          </ThemedText>
          <LiveBars levels={levels} recording={isRecording} />
          <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
            {isRecording
              ? 'You can lock your phone. Tap stop to save.'
              : 'Keeps recording when your phone is locked.'}
          </ThemedText>
        </View>

        <RecordButton recording={isRecording} onPress={onToggle} />
      </SafeAreaView>
    </ThemedView>
  );
}

const LIVE_BARS = 48;

/**
 * The microphone level as bars that scroll in from the right while recording,
 * newest last, so the screen moves with the voice. Flat and gray when idle.
 */
function LiveBars({ levels, recording }: { levels: number[]; recording: boolean }) {
  const theme = useTheme();
  const recent = levels.slice(-LIVE_BARS);
  const bars = [...Array<number>(LIVE_BARS - recent.length).fill(0), ...recent];

  return (
    <View style={styles.live} testID="record-levels" accessible={false}>
      {bars.map((level, i) => (
        <View
          key={i}
          style={[
            styles.liveBar,
            {
              height: 4 + level * 60,
              backgroundColor: recording ? Accent.danger : theme.textSecondary,
              opacity: recording ? 0.35 + level * 0.65 : 0.3,
            },
          ]}
        />
      ))}
    </View>
  );
}

/**
 * The record control, drawn like a camera shutter: a ring around a red dot
 * that becomes a square to stop, with a soft pulse while recording.
 */
function RecordButton({ recording, onPress }: { recording: boolean; onPress: () => void }) {
  const theme = useTheme();
  // State, not a ref: the compiler forbids reading refs while rendering.
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!recording) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, recording]);

  return (
    <View style={styles.shutterWrap}>
      {recording && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.halo,
            {
              backgroundColor: Accent.danger,
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] }),
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }) }],
            },
          ]}
        />
      )}
      <Pressable
        testID="record-toggle"
        accessibilityRole="button"
        accessibilityLabel={recording ? 'Stop recording' : 'Start recording'}
        onPress={onPress}
        style={({ pressed }) => [
          styles.shutter,
          { borderColor: theme.text, backgroundColor: theme.background },
          pressed && styles.pressed,
        ]}>
        <View style={[recording ? styles.stopSquare : styles.recordDot, { backgroundColor: Accent.danger }]} />
      </Pressable>
    </View>
  );
}

function Message({
  testID,
  icon,
  title,
  body,
  children,
}: {
  testID: string;
  icon: IconName;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['bottom']} style={styles.message} testID={testID}>
        <View style={[styles.badge, { backgroundColor: AccentTint.danger }]}>
          <Icon name={icon} size={34} color={Accent.danger} />
        </View>
        <ThemedText type="subtitle" style={styles.center}>
          {title}
        </ThemedText>
        <ThemedText type="default" themeColor="textSecondary" style={styles.center}>
          {body}
        </ThemedText>
        <View style={styles.messageAction}>{children}</View>
      </SafeAreaView>
    </ThemedView>
  );
}

const SHUTTER = 84;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  message: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.five,
  },
  messageAction: {
    marginTop: Spacing.two,
  },
  badge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  center: {
    textAlign: 'center',
    maxWidth: 320,
  },
  recorder: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.five,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + Spacing.half,
    borderRadius: 999,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  middle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  timer: {
    fontSize: 80,
    lineHeight: 88,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
  },
  live: {
    height: 72,
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveBar: {
    width: 3,
    borderRadius: 2,
  },
  shutterWrap: {
    width: SHUTTER,
    height: SHUTTER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: SHUTTER,
    height: SHUTTER,
    borderRadius: SHUTTER / 2,
  },
  shutter: {
    width: SHUTTER,
    height: SHUTTER,
    borderRadius: SHUTTER / 2,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordDot: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  stopSquare: {
    width: 30,
    height: 30,
    borderRadius: 8,
  },
  pressed: {
    opacity: 0.7,
  },
});
