import { act, renderHook, waitFor } from '@testing-library/react-native';

import type { ModelFiles } from '@/lib/transcription/whisper-model';
import { WhisperModel } from '@/lib/transcription/whisper-model';

import { useWhisperModel } from '../use-whisper-model';

function makeFiles(overrides: Partial<ModelFiles> = {}): ModelFiles {
  return {
    modelPath: 'file:///doc/whisper/model.bin',
    exists: jest.fn().mockResolvedValue(false),
    download: jest.fn().mockResolvedValue(true),
    remove: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('useWhisperModel', () => {
  it('reports not-downloaded when the model file is missing', async () => {
    const model = new WhisperModel(makeFiles());
    const { result } = await renderHook(() => useWhisperModel(model));

    await waitFor(() => expect(result.current.status).toBe('not-downloaded'));
  });

  it('reports ready when the model file exists', async () => {
    const model = new WhisperModel(makeFiles({ exists: jest.fn().mockResolvedValue(true) }));
    const { result } = await renderHook(() => useWhisperModel(model));

    await waitFor(() => expect(result.current.status).toBe('ready'));
  });

  it('downloads with progress and becomes ready', async () => {
    const files = makeFiles({
      download: jest.fn(async (_url, _path, onProgress) => {
        onProgress?.(0.5);
        onProgress?.(1);
        return true;
      }),
    });
    const model = new WhisperModel(files);
    const { result } = await renderHook(() => useWhisperModel(model));
    await waitFor(() => expect(result.current.status).toBe('not-downloaded'));

    await act(async () => {
      await result.current.download();
    });

    expect(result.current.status).toBe('ready');
    expect(result.current.progress).toBe(1);
  });

  it('surfaces an interrupted download as an error for retry', async () => {
    const model = new WhisperModel(makeFiles({ download: jest.fn().mockResolvedValue(false) }));
    const { result } = await renderHook(() => useWhisperModel(model));
    await waitFor(() => expect(result.current.status).toBe('not-downloaded'));

    await act(async () => {
      await result.current.download();
    });

    expect(result.current.status).toBe('error');
  });

  it('removes the model and returns to not-downloaded', async () => {
    const files = makeFiles({ exists: jest.fn().mockResolvedValue(true) });
    const model = new WhisperModel(files);
    const { result } = await renderHook(() => useWhisperModel(model));
    await waitFor(() => expect(result.current.status).toBe('ready'));

    await act(async () => {
      await result.current.remove();
    });

    expect(result.current.status).toBe('not-downloaded');
    expect(files.remove).toHaveBeenCalled();
  });
});
