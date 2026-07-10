/* eslint-disable import/first -- jest.mock and its mock object must precede imports */
const mockRecorder = {
  prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
  record: jest.fn(),
  stop: jest.fn().mockResolvedValue(undefined),
  uri: 'file:///tmp/rec.wav' as string | null,
  currentTime: 0,
  isRecording: false,
};

jest.mock('expo-audio', () => ({
  useAudioRecorder: () => mockRecorder,
  setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
  RecordingPresets: { HIGH_QUALITY: { ios: {} } },
  IOSOutputFormat: { LINEARPCM: 'lpcm' },
  AudioQuality: { HIGH: 96 },
}));

import { act, renderHook } from '@testing-library/react-native';

import type { Recording, RecordingStore } from '@/lib/domain';

import { useRecorder } from '../use-recorder';

function makeStore(): { store: RecordingStore; save: jest.Mock } {
  const saved: Recording = {
    id: 'r1',
    title: 'Recording',
    createdAt: 0,
    durationMs: 0,
    fileUri: 'file:///doc/recordings/r1.wav',
  };
  const save = jest.fn().mockResolvedValue(saved);
  return { store: { save } as unknown as RecordingStore, save };
}

function clock(values: number[]): () => number {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

beforeEach(() => {
  mockRecorder.uri = 'file:///tmp/rec.wav';
  mockRecorder.prepareToRecordAsync.mockClear();
  mockRecorder.record.mockClear();
  mockRecorder.stop.mockClear();
});

describe('useRecorder', () => {
  it('records then saves with the captured duration', async () => {
    const { store, save } = makeStore();
    const now = clock([1000, 6000]);
    const { result } = await renderHook(() => useRecorder(store, { now }));

    await act(async () => {
      await result.current.start();
    });
    expect(result.current.isRecording).toBe(true);
    expect(mockRecorder.record).toHaveBeenCalledTimes(1);

    let saved: Recording | null = null;
    await act(async () => {
      saved = await result.current.stop();
    });

    expect(mockRecorder.stop).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith({ fileUri: 'file:///tmp/rec.wav', durationMs: 5000 });
    expect(saved).toMatchObject({ id: 'r1' });
    expect(result.current.isRecording).toBe(false);
  });

  it('stop is a no-op when not recording', async () => {
    const { store, save } = makeStore();
    const { result } = await renderHook(() => useRecorder(store));

    let out: Recording | null = { id: 'x' } as Recording;
    await act(async () => {
      out = await result.current.stop();
    });

    expect(out).toBeNull();
    expect(save).not.toHaveBeenCalled();
  });

  it('discards a zero-length recording', async () => {
    const { store, save } = makeStore();
    const now = clock([2000, 2000]);
    const { result } = await renderHook(() => useRecorder(store, { now }));

    await act(async () => {
      await result.current.start();
    });
    let out: Recording | null = null;
    await act(async () => {
      out = await result.current.stop();
    });

    expect(mockRecorder.stop).toHaveBeenCalledTimes(1);
    expect(out).toBeNull();
    expect(save).not.toHaveBeenCalled();
  });
});
