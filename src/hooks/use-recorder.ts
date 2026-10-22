import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { Recording, RecordingStore } from '@/lib/domain';
import { useRecorderGateway } from '@/lib/recorder-context';

/** How often the timer and the input level update while recording. */
export const LEVEL_INTERVAL_MS = 100;
// Enough samples to fill the live bars across the record screen.
const MAX_LEVELS = 48;

export type UseRecorderOptions = {
  /** Clock, injectable for deterministic tests. */
  now?: () => number;
};

export type UseRecorder = {
  isRecording: boolean;
  elapsedMs: number;
  /** Recent input levels from 0 to 1, oldest first, while recording. */
  levels: number[];
  start: () => Promise<void>;
  /** Stops and saves, returning the saved recording, or null when discarded. */
  stop: () => Promise<Recording | null>;
};

/**
 * Records audio through the Recorder gateway and saves it through the injected
 * store. A stop with no active recording is a no-op, and a zero-length capture
 * is discarded rather than saved.
 */
export function useRecorder(store: RecordingStore, options: UseRecorderOptions = {}): UseRecorder {
  const now = useMemo(() => options.now ?? (() => Date.now()), [options.now]);
  const recorder = useRecorderGateway();
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [levels, setLevels] = useState<number[]>([]);
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
    await recorder.prepare();
    recorder.start();
    startedAtRef.current = now();
    setElapsedMs(0);
    setLevels([]);
    setIsRecording(true);
    clearTimer();
    timerRef.current = setInterval(() => {
      setElapsedMs(now() - startedAtRef.current);
      const level = recorder.level() ?? 0;
      setLevels((recent) => [...recent, level].slice(-MAX_LEVELS));
    }, LEVEL_INTERVAL_MS);
  }, [clearTimer, isRecording, now, recorder]);

  const stop = useCallback(async (): Promise<Recording | null> => {
    if (!isRecording) return null;
    clearTimer();
    setIsRecording(false);
    const durationMs = now() - startedAtRef.current;
    const uri = await recorder.stop();
    if (!uri || durationMs <= 0) {
      return null; // discard empty captures
    }
    return store.save({ fileUri: uri, durationMs });
  }, [clearTimer, isRecording, now, recorder, store]);

  return { isRecording, elapsedMs, levels, start, stop };
}
