import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

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

  // Reload whenever the screen gains focus (including first mount), so a
  // recording saved on another screen appears when navigating back.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return { status, recordings, reload: load };
}
