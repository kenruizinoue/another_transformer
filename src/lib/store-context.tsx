import { createContext, useContext, type ReactNode } from 'react';

import { expoFileSystemPort } from '@/lib/adapters/expo-filesystem-port';
import { FileSystemRecordingStore } from '@/lib/adapters/filesystem-recording-store';
import type { RecordingStore } from '@/lib/domain';

const StoreContext = createContext<RecordingStore | null>(null);

let defaultStore: RecordingStore | null = null;

function getDefaultStore(): RecordingStore {
  if (!defaultStore) {
    defaultStore = new FileSystemRecordingStore({ fs: expoFileSystemPort });
  }
  return defaultStore;
}

export function RecordingStoreProvider({
  store,
  children,
}: {
  store: RecordingStore;
  children: ReactNode;
}) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

/**
 * The recording store for the current tree. Screens and hooks depend on this,
 * not on a concrete store, so tests can inject a fake via RecordingStoreProvider.
 * Falls back to the real file-system store when no provider is present.
 */
export function useRecordingStore(): RecordingStore {
  return useContext(StoreContext) ?? getDefaultStore();
}
