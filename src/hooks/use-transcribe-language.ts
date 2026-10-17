import { useCallback, useEffect, useState } from 'react';

import type { TranscribeLanguage } from '@/lib/domain';
import { getTranscribeLanguage, setTranscribeLanguage } from '@/lib/transcription/preference';

/** Reads and updates the persisted language of the recordings. */
export function useTranscribeLanguage() {
  const [language, setLocal] = useState<TranscribeLanguage>('en-US');

  useEffect(() => {
    // Load the stored language once on mount.
    getTranscribeLanguage().then(setLocal);
  }, []);

  const setLanguage = useCallback(async (next: TranscribeLanguage) => {
    setLocal(next);
    await setTranscribeLanguage(next);
  }, []);

  return { language, setLanguage };
}
