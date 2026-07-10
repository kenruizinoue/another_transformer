import { useCallback, useEffect, useState } from 'react';

import type { Recording } from '@/lib/domain';
import { useRecordingStore } from '@/lib/store-context';

export type RecordingsStatus = 'loading' | 'loaded' | 'error';

export type UseRecordings = {
  status: RecordingsStatus;
  recordings: Recording[];
  reload: () => void;
};

/**
 * Loads the recordings list from the store, exposing loading, loaded, and error
 * states. Screens compose this hook rather than reading the store directly.
 */
export function useRecordings(): UseRecordings {
  const store = useRecordingStore();
  const [status, setStatus] = useState<RecordingsStatus>('loading');
  const [recordings, setRecordings] = useState<Recording[]>([]);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      setRecordings(await store.list());
      setStatus('loaded');
    } catch {
      setStatus('error');
    }
  }, [store]);

  useEffect(() => {
    // Load once on mount; state is set after the async list resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return { status, recordings, reload: load };
}
