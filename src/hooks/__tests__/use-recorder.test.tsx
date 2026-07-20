import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import type { Recorder, Recording, RecordingStore } from '@/lib/domain';
import { RecorderProvider } from '@/lib/recorder-context';
import { makeFakeRecorder } from '@/test-utils/store';

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

function withRecorder(recorder: Recorder) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <RecorderProvider recorder={recorder}>{children}</RecorderProvider>;
  };
}

describe('useRecorder', () => {
  it('records then saves with the captured duration', async () => {
    const recorder = makeFakeRecorder();
    const { store, save } = makeStore();
    const now = clock([1000, 6000]);
    const { result } = await renderHook(() => useRecorder(store, { now }), {
      wrapper: withRecorder(recorder),
    });

    await act(async () => {
      await result.current.start();
    });
    expect(result.current.isRecording).toBe(true);
    expect(recorder.prepare).toHaveBeenCalledTimes(1);
    expect(recorder.start).toHaveBeenCalledTimes(1);

    let saved: Recording | null = null;
    await act(async () => {
      saved = await result.current.stop();
    });

    expect(recorder.stop).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith({ fileUri: 'file:///tmp/rec.wav', durationMs: 5000 });
    expect(saved).toMatchObject({ id: 'r1' });
    expect(result.current.isRecording).toBe(false);
  });

  it('stop is a no-op when not recording', async () => {
    const recorder = makeFakeRecorder();
    const { store, save } = makeStore();
    const { result } = await renderHook(() => useRecorder(store), {
      wrapper: withRecorder(recorder),
    });

    let out: Recording | null = { id: 'x' } as Recording;
    await act(async () => {
      out = await result.current.stop();
    });

    expect(out).toBeNull();
    expect(recorder.stop).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it('discards a zero-length recording', async () => {
    const recorder = makeFakeRecorder();
    const { store, save } = makeStore();
    const now = clock([2000, 2000]);
    const { result } = await renderHook(() => useRecorder(store, { now }), {
      wrapper: withRecorder(recorder),
    });

    await act(async () => {
      await result.current.start();
    });
    let out: Recording | null = null;
    await act(async () => {
      out = await result.current.stop();
    });

    expect(recorder.stop).toHaveBeenCalledTimes(1);
    expect(out).toBeNull();
    expect(save).not.toHaveBeenCalled();
  });

  it('discards a capture that produced no file', async () => {
    const recorder = makeFakeRecorder({ stop: jest.fn().mockResolvedValue(null) });
    const { store, save } = makeStore();
    const now = clock([1000, 4000]);
    const { result } = await renderHook(() => useRecorder(store, { now }), {
      wrapper: withRecorder(recorder),
    });

    await act(async () => {
      await result.current.start();
    });
    let out: Recording | null = null;
    await act(async () => {
      out = await result.current.stop();
    });

    expect(out).toBeNull();
    expect(save).not.toHaveBeenCalled();
  });
});
