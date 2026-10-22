import { act, renderHook, waitFor } from '@testing-library/react-native';

import { makeFakeStore, makeRecording, withStore } from '@/test-utils/store';

import { useRecordings } from '../use-recordings';

describe('useRecordings', () => {
  it('loads recordings from the store', async () => {
    const recordings = [makeRecording({ id: 'a' }), makeRecording({ id: 'b' })];
    const store = makeFakeStore({ list: jest.fn().mockResolvedValue(recordings) });

    const { result } = await renderHook(() => useRecordings(), { wrapper: withStore(store) });

    await waitFor(() => expect(result.current.status).toBe('loaded'));
    expect(result.current.recordings).toHaveLength(2);
  });

  it('reports the loaded empty state when there are no recordings', async () => {
    const store = makeFakeStore({ list: jest.fn().mockResolvedValue([]) });

    const { result } = await renderHook(() => useRecordings(), { wrapper: withStore(store) });

    await waitFor(() => expect(result.current.status).toBe('loaded'));
    expect(result.current.recordings).toEqual([]);
  });

  it('keeps showing the list while it reloads', async () => {
    let finish: (value: unknown) => void = () => {};
    const list = jest
      .fn()
      .mockResolvedValueOnce([makeRecording({ id: 'a' })])
      .mockImplementationOnce(() => new Promise((resolve) => (finish = resolve)));
    const store = makeFakeStore({ list });

    const { result } = await renderHook(() => useRecordings(), { wrapper: withStore(store) });
    await waitFor(() => expect(result.current.status).toBe('loaded'));

    // Coming back to the screen reloads; the rows must not flash to a spinner.
    await act(async () => {
      result.current.reload();
    });
    expect(result.current.status).toBe('loaded');
    expect(result.current.recordings).toHaveLength(1);
    await act(async () => finish([makeRecording({ id: 'a' }), makeRecording({ id: 'b' })]));
    expect(result.current.recordings).toHaveLength(2);
  });

  it('reports an error when the store read fails', async () => {
    const store = makeFakeStore({ list: jest.fn().mockRejectedValue(new Error('disk')) });

    const { result } = await renderHook(() => useRecordings(), { wrapper: withStore(store) });

    await waitFor(() => expect(result.current.status).toBe('error'));
  });
});
