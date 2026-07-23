import { render } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';

import type { Recorder, Recording, RecordingStore } from '@/lib/domain';
import { RecorderProvider } from '@/lib/recorder-context';
import { RecordingStoreProvider } from '@/lib/store-context';
import { TranscriptionProvider, type TranscriberRouter } from '@/lib/transcription-context';
import type { TranscriptionResult } from '@/lib/transcription/router';

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

export function makeFakeRouter(
  result: TranscriptionResult = { text: null, engine: null, notes: [] },
): TranscriberRouter {
  return { transcribe: jest.fn().mockResolvedValue(result) };
}

/** A Recorder of jest mocks; override per test (permission, captured uri). */
export function makeFakeRecorder(overrides: Partial<Recorder> = {}): Recorder {
  return {
    getPermission: jest.fn().mockResolvedValue('granted'),
    requestPermission: jest.fn().mockResolvedValue('granted'),
    prepare: jest.fn().mockResolvedValue(undefined),
    start: jest.fn(),
    stop: jest.fn().mockResolvedValue('file:///tmp/rec.wav'),
    ...overrides,
  };
}

export function renderWithProviders(
  ui: ReactElement,
  {
    store = makeFakeStore(),
    router = makeFakeRouter(),
    recorder = makeFakeRecorder(),
  }: { store?: RecordingStore; router?: TranscriberRouter; recorder?: Recorder } = {},
) {
  return render(
    <RecordingStoreProvider store={store}>
      <TranscriptionProvider router={router}>
        <RecorderProvider recorder={recorder}>{ui}</RecorderProvider>
      </TranscriptionProvider>
    </RecordingStoreProvider>,
  );
}
