import { createContext, useContext, type ReactNode } from 'react';

import { useExpoRecorder } from '@/lib/adapters/expo-recorder';
import type { Recorder } from '@/lib/domain';

const RecorderContext = createContext<Recorder | null>(null);

export function RecorderProvider({
  recorder,
  children,
}: {
  recorder: Recorder;
  children: ReactNode;
}) {
  return <RecorderContext.Provider value={recorder}>{children}</RecorderContext.Provider>;
}

/**
 * The Recorder for the current tree: an injected fake in tests, the expo
 * adapter otherwise. The adapter hook is always called to keep hook order
 * stable; it is inert under the global test mock.
 */
export function useRecorderGateway(): Recorder {
  const injected = useContext(RecorderContext);
  const fallback = useExpoRecorder();
  return injected ?? fallback;
}
