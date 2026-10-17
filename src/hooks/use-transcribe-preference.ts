import { useCallback, useEffect, useState } from 'react';

import type { TranscriptionEngine } from '@/lib/domain';
import {
  getTranscribePreference,
  setTranscribePreference,
} from '@/lib/transcription/preference';

/** Reads and updates the persisted transcription engine preference. */
export function useTranscribePreference() {
  const [preference, setLocal] = useState<TranscriptionEngine>('apple');

  useEffect(() => {
    // Load the stored preference once on mount.
     
    getTranscribePreference().then(setLocal);
  }, []);

  const setPreference = useCallback(async (engine: TranscriptionEngine) => {
    setLocal(engine);
    await setTranscribePreference(engine);
  }, []);

  return { preference, setPreference };
}
