import { useCallback, useState } from 'react';

import type { Recording } from '@/lib/domain';
import { useRecordingStore } from '@/lib/store-context';
import { useTranscriber } from '@/lib/transcription-context';

export type TranscribeStatus = 'idle' | 'transcribing' | 'done' | 'error';

/**
 * Transcribes a recording through the engine router and saves the transcript to
 * the store. Exposes the in-progress status and the resulting text; a null
 * result (every engine failed, e.g. offline with only the cloud engine) surfaces
 * as an error.
 */
export function useTranscribe() {
  const store = useRecordingStore();
  const router = useTranscriber();
  const [status, setStatus] = useState<TranscribeStatus>('idle');
  const [transcript, setTranscript] = useState<string | null>(null);

  const run = useCallback(
    async (recording: Recording) => {
      setStatus('transcribing');
      try {
        const result = await router.transcribe(recording.fileUri);
        if (!result.text) {
          setStatus('error');
          return;
        }
        await store.setTranscript(recording.id, result.text, result.engine);
        setTranscript(result.text);
        setStatus('done');
      } catch {
        setStatus('error');
      }
    },
    [router, store],
  );

  return { status, transcript, run };
}
