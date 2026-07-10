import { useCallback, useEffect, useState } from 'react';

import type { Recording } from '@/lib/domain';
import { useRecordingStore } from '@/lib/store-context';

export type RecordingStatus = 'loading' | 'loaded' | 'notfound';

export type UseRecording = {
  status: RecordingStatus;
  recording: Recording | null;
  reload: () => void;
  /** Renames the recording; returns false without saving for an empty title. */
  rename: (title: string) => Promise<boolean>;
  remove: () => Promise<void>;
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

  const rename = useCallback(
    async (title: string): Promise<boolean> => {
      if (!id || !title.trim()) {
        return false;
      }
      setRecording(await store.rename(id, title));
      return true;
    },
    [id, store],
  );

  const remove = useCallback(async (): Promise<void> => {
    if (id) {
      await store.remove(id);
    }
  }, [id, store]);

  return { status, recording, reload: load, rename, remove };
}
