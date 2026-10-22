import { renderHook, waitFor } from '@testing-library/react-native';

import { useWaveform } from '../use-waveform';

describe('useWaveform', () => {
  it('loads the bars for a file', async () => {
    const read = jest.fn().mockResolvedValue([0.2, 1]);
    const { result } = await renderHook(() => useWaveform('file:///a.wav', 2, read));

    await waitFor(() => expect(result.current).toEqual([0.2, 1]));
    expect(read).toHaveBeenCalledWith('file:///a.wav', 2);
  });

  it('stays null without a file or when reading fails', async () => {
    const read = jest.fn().mockResolvedValue(null);
    const { result } = await renderHook(() => useWaveform(null, 2, read));
    expect(result.current).toBeNull();
    expect(read).not.toHaveBeenCalled();

    const failed = await renderHook(() => useWaveform('file:///a.wav', 2, read));
    await waitFor(() => expect(read).toHaveBeenCalled());
    expect(failed.result.current).toBeNull();
  });
});
