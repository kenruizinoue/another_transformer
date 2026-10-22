import {
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  useAudioRecorder,
} from 'expo-audio';
import { useMemo } from 'react';

import { configureRecordingAudioSession } from '@/lib/audio/audio-session';
import { meteringToLevel } from '@/lib/audio/metering';
import { WAV_16K_MONO } from '@/lib/audio/recording-options';
import type { Recorder, RecorderPermission } from '@/lib/domain';

function toPermission(result: { granted: boolean; canAskAgain: boolean }): RecorderPermission {
  if (result.granted) return 'granted';
  return result.canAskAgain ? 'undetermined' : 'denied';
}

/**
 * The real Recorder over expo-audio: 16 kHz mono WAV with the background
 * capable audio session. The only recording code that touches expo-audio.
 */
export function useExpoRecorder(): Recorder {
  const recorder = useAudioRecorder(WAV_16K_MONO);

  return useMemo(
    () => ({
      async getPermission() {
        return toPermission(await getRecordingPermissionsAsync());
      },
      async requestPermission() {
        return toPermission(await requestRecordingPermissionsAsync());
      },
      async prepare() {
        await configureRecordingAudioSession();
        await recorder.prepareToRecordAsync();
      },
      start() {
        recorder.record();
      },
      async stop() {
        await recorder.stop();
        return recorder.uri;
      },
      level() {
        const decibels = recorder.getStatus().metering;
        return typeof decibels === 'number' ? meteringToLevel(decibels) : null;
      },
    }),
    [recorder],
  );
}
