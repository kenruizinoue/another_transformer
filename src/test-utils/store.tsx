import { render } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';

import type { Recording, RecordingStore } from '@/lib/domain';
import { RecordingStoreProvider } from '@/lib/store-context';

/** A RecordingStore of jest mocks; override individual methods per test. */
export function makeFakeStore(overrides: Partial<RecordingStore> = {}): RecordingStore {
  return {
    list: jest.fn().mockResolvedValue([]),
    get: jest.fn().mockResolvedValue(null),
    save: jest.fn(),
    rename: jest.fn(),
    setTranscript: jest.fn(),
    remove: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as RecordingStore;
}

export function makeRecording(overrides: Partial<Recording> = {}): Recording {
  return {
    id: 'r1',
    title: 'Recording',
    createdAt: Date.UTC(2026, 6, 10, 14, 30),
    durationMs: 5_000,
    fileUri: 'file:///doc/recordings/r1.wav',
    ...overrides,
  };
}

export function withStore(store: RecordingStore) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <RecordingStoreProvider store={store}>{children}</RecordingStoreProvider>;
  };
}

export function renderWithStore(ui: ReactElement, store: RecordingStore = makeFakeStore()) {
  return render(<RecordingStoreProvider store={store}>{ui}</RecordingStoreProvider>);
}
