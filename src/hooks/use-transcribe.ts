import { useCallback, useState } from 'react';

import type { Recording } from '@/lib/domain';
import { useRecordingStore } from '@/lib/store-context';
import { useTranscriber } from '@/lib/transcription-context';

export type TranscribeStatus = 'idle' | 'transcribing' | 'done' | 'error';

/**
 * Transcribes a recording through the engine router and saves the transcript to
 * the store, which stays the single source of truth: callers reload the
 * recording via onSuccess instead of reading text from this hook. A null router
 * result (every engine failed, e.g. offline with only the cloud engine)
 * surfaces as an error.
 */
export function useTranscribe(onSuccess?: () => void) {
  const store = useRecordingStore();
  const router = useTranscriber();
  const [status, setStatus] = useState<TranscribeStatus>('idle');
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  const run = useCallback(
    async (recording: Recording) => {
      setStatus('transcribing');
      setErrorDetail(null);
      try {
        const result = await router.transcribe(recording.fileUri, {
          durationMsHint: recording.durationMs,
        });
        if (result.text === null) {
          setErrorDetail(result.notes.length > 0 ? result.notes.join(' · ') : null);
          setStatus('error');
          return;
        }
        await store.setTranscript(recording.id, result.text, result.engine);
        setStatus('done');
        onSuccess?.();
      } catch (error) {
        setErrorDetail(String(error));
        setStatus('error');
      }
    },
    [onSuccess, router, store],
  );

  return { status, errorDetail, run };
}
