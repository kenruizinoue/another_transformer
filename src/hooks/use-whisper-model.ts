import { useCallback, useEffect, useState } from 'react';

import type { WhisperModel } from '@/lib/transcription/whisper-model';
import { whisperModel } from '@/lib/transcription/whisper-model-instance';

export type WhisperModelStatus = 'checking' | 'not-downloaded' | 'downloading' | 'ready' | 'error';

/**
 * Observes and manages the on-device Whisper model: readiness, download with
 * progress, retry after an error, and removal. The model manager is injectable
 * for tests and defaults to the app's shared instance.
 */
export function useWhisperModel(model: WhisperModel = whisperModel) {
  const [status, setStatus] = useState<WhisperModelStatus>('checking');
  const [progress, setProgress] = useState(0);

  const refresh = useCallback(async () => {
    const ready = await model.isReady();
    setStatus(ready ? 'ready' : 'not-downloaded');
  }, [model]);

  useEffect(() => {
    // Check the model file once on mount; state is set after the async check.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const download = useCallback(async () => {
    setStatus('downloading');
    setProgress(0);
    const ok = await model.ensureReady((fraction) => setProgress(fraction));
    setStatus(ok ? 'ready' : 'error');
  }, [model]);

  const remove = useCallback(async () => {
    await model.remove();
    setProgress(0);
    setStatus('not-downloaded');
  }, [model]);

  return { status, progress, download, remove };
}
