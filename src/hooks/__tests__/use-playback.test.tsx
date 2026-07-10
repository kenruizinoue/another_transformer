/* eslint-disable import/first -- jest.mock and its mock state must precede imports */
const mockStatus = {
  playing: false,
  currentTime: 0,
  duration: 5,
  didJustFinish: false,
  isBuffering: false,
  isLoaded: true,
};
const mockPlayer = {
  play: jest.fn(),
  pause: jest.fn(),
  seekTo: jest.fn().mockResolvedValue(undefined),
  remove: jest.fn(),
};

jest.mock('expo-audio', () => ({
  useAudioPlayer: () => mockPlayer,
  useAudioPlayerStatus: () => mockStatus,
}));

import { renderHook } from '@testing-library/react-native';

import { usePlayback } from '../use-playback';

beforeEach(() => {
  mockStatus.playing = false;
  mockStatus.currentTime = 0;
  mockStatus.duration = 5;
  mockStatus.didJustFinish = false;
  mockPlayer.play = jest.fn();
  mockPlayer.pause = jest.fn();
  mockPlayer.seekTo = jest.fn().mockResolvedValue(undefined);
});

describe('usePlayback', () => {
  it('exposes position and duration in milliseconds', async () => {
    mockStatus.currentTime = 2;
    mockStatus.duration = 5;
    const { result } = await renderHook(() => usePlayback('file:///a.wav'));
    expect(result.current.positionMs).toBe(2000);
    expect(result.current.durationMs).toBe(5000);
  });

  it('plays when paused and pauses when playing', async () => {
    const paused = await renderHook(() => usePlayback('file:///a.wav'));
    paused.result.current.toggle();
    expect(mockPlayer.play).toHaveBeenCalledTimes(1);

    mockStatus.playing = true;
    const playing = await renderHook(() => usePlayback('file:///a.wav'));
    playing.result.current.toggle();
    expect(mockPlayer.pause).toHaveBeenCalledTimes(1);
  });

  it('seeks in seconds', async () => {
    const { result } = await renderHook(() => usePlayback('file:///a.wav'));
    result.current.seekTo(3000);
    expect(mockPlayer.seekTo).toHaveBeenCalledWith(3);
  });

  it('resets to the start when playback finishes', async () => {
    mockStatus.didJustFinish = true;
    await renderHook(() => usePlayback('file:///a.wav'));
    expect(mockPlayer.seekTo).toHaveBeenCalledWith(0);
  });

  it('surfaces an error when a control throws', async () => {
    mockPlayer.play = jest.fn(() => {
      throw new Error('missing file');
    });
    const { result, rerender } = await renderHook(() => usePlayback('file:///gone.wav'));
    result.current.toggle();
    await rerender({});
    expect(result.current.error).toBe(true);
  });
});
