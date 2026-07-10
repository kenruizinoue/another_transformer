import { createContext, useContext, type ReactNode } from 'react';

import type { TranscribeOptions } from '@/lib/domain';
import type { TranscriptionResult } from '@/lib/transcription/router';

export type TranscriberRouter = {
  transcribe(fileUri: string, options?: TranscribeOptions): Promise<TranscriptionResult>;
};

const TranscriptionContext = createContext<TranscriberRouter | null>(null);

let defaultRouter: TranscriberRouter | null = null;

function getDefaultRouter(): TranscriberRouter {
  if (!defaultRouter) {
    // Lazy require so native transcription adapters load only in the app, not tests.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    defaultRouter = require('@/lib/transcription/default-router').defaultRouter;
  }
  return defaultRouter as TranscriberRouter;
}

export function TranscriptionProvider({
  router,
  children,
}: {
  router: TranscriberRouter;
  children: ReactNode;
}) {
  return <TranscriptionContext.Provider value={router}>{children}</TranscriptionContext.Provider>;
}

/**
 * The transcription router for the current tree. Screens depend on this, not on
 * the concrete engines, so tests inject a fake via TranscriptionProvider. The
 * real router (which pulls in native engines) is required lazily so it never
 * loads in tests.
 */
export function useTranscriber(): TranscriberRouter {
  return useContext(TranscriptionContext) ?? getDefaultRouter();
}
