import { setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { WAV_16K_MONO } from '@/lib/audio/recording-options';
import type { Recording, RecordingStore } from '@/lib/domain';

export type UseRecorderOptions = {
  /** Clock, injectable for deterministic tests. */
  now?: () => number;
};

export type UseRecorder = {
  isRecording: boolean;
  elapsedMs: number;
  start: () => Promise<void>;
  /** Stops and saves, returning the saved recording, or null when discarded. */
  stop: () => Promise<Recording | null>;
};

/**
 * Records 16 kHz mono WAV audio and saves it through the injected store. A stop
 * with no active recording is a no-op, and a zero-length capture is discarded
 * rather than saved.
 */
export function useRecorder(store: RecordingStore, options: UseRecorderOptions = {}): UseRecorder {
  const now = useMemo(() => options.now ?? (() => Date.now()), [options.now]);
  const recorder = useAudioRecorder(WAV_16K_MONO);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const start = useCallback(async () => {
    if (isRecording) return;
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    startedAtRef.current = now();
    setElapsedMs(0);
    setIsRecording(true);
    clearTimer();
    timerRef.current = setInterval(() => {
      setElapsedMs(now() - startedAtRef.current);
    }, 250);
  }, [clearTimer, isRecording, now, recorder]);

  const stop = useCallback(async (): Promise<Recording | null> => {
    if (!isRecording) return null;
    clearTimer();
    setIsRecording(false);
    const durationMs = now() - startedAtRef.current;
    await recorder.stop();
    const uri = recorder.uri;
    if (!uri || durationMs <= 0) {
      return null; // discard empty captures
    }
    return store.save({ fileUri: uri, durationMs });
  }, [clearTimer, isRecording, now, recorder, store]);

  return { isRecording, elapsedMs, start, stop };
}
