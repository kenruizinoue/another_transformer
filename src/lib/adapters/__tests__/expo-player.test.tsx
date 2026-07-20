import { renderHook } from '@testing-library/react-native';
import { useAudioPlayer } from 'expo-audio';

import { useExpoPlayer } from '../expo-player';

// expo-audio is auto-mocked from __mocks__/expo-audio.js; useAudioPlayer
// returns a shared mock player object we can assert against.
const nativePlayer = (useAudioPlayer as unknown as () => Record<string, jest.Mock>)();

describe('useExpoPlayer (adapter boundary)', () => {
  it('delegates play, pause, and seek in seconds', async () => {
    const { result } = await renderHook(() => useExpoPlayer('file:///a.wav'));

    result.current.play();
    expect(nativePlayer.play).toHaveBeenCalled();

    result.current.pause();
    expect(nativePlayer.pause).toHaveBeenCalled();

    result.current.seekToMs(3000);
    expect(nativePlayer.seekTo).toHaveBeenCalledWith(3);
  });

  it('maps the native status to millisecond fields', async () => {
    const { result } = await renderHook(() => useExpoPlayer('file:///a.wav'));

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.positionMs).toBe(0);
    expect(result.current.durationMs).toBe(0);
    expect(result.current.didJustFinish).toBe(false);
  });
});
