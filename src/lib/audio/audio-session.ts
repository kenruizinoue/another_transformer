import { setAudioModeAsync, type AudioMode } from 'expo-audio';

/**
 * Audio mode for recording that keeps capturing while the app is backgrounded
 * or the iPhone is locked. `allowsBackgroundRecording` and `shouldPlayInBackground`
 * are the flags that keep the session alive; they pair with the `audio`
 * UIBackgroundMode declared in app.json. Verified on a dev build, not in Expo Go.
 */
export function buildRecordingAudioMode(): Partial<AudioMode> {
  return {
    allowsRecording: true,
    playsInSilentMode: true,
    shouldPlayInBackground: true,
    allowsBackgroundRecording: true,
    interruptionMode: 'doNotMix',
    shouldRouteThroughEarpiece: false,
  };
}

/** Apply the recording audio session before starting a capture. */
export async function configureRecordingAudioSession(): Promise<void> {
  await setAudioModeAsync(buildRecordingAudioMode());
}
