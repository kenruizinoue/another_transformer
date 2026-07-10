import { useCallback, useEffect, useState } from 'react';

import type { Recording } from '@/lib/domain';
import { useRecordingStore } from '@/lib/store-context';

export type RecordingStatus = 'loading' | 'loaded' | 'notfound';

export type UseRecording = {
  status: RecordingStatus;
  recording: Recording | null;
  reload: () => void;
};

/** Loads a single recording by id from the store. */
export function useRecording(id: string | undefined): UseRecording {
  const store = useRecordingStore();
  const [recording, setRecording] = useState<Recording | null>(null);
  const [status, setStatus] = useState<RecordingStatus>('loading');

  const load = useCallback(async () => {
    if (!id) {
      setStatus('notfound');
      return;
    }
    setStatus('loading');
    const found = await store.get(id);
    setRecording(found);
    setStatus(found ? 'loaded' : 'notfound');
  }, [id, store]);

  useEffect(() => {
    // Load on mount / when id changes; state is set after the async get.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return { status, recording, reload: load };
}
