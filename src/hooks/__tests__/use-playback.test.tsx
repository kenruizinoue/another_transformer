import { renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import type { Player } from '@/lib/domain';
import { PlayerProvider } from '@/lib/player-context';

import { usePlayback } from '../use-playback';

type PlayerState = Pick<Player, 'isPlaying' | 'positionMs' | 'durationMs' | 'didJustFinish'>;

function makePlayer(state: Partial<PlayerState> = {}) {
  const player: Player = {
    isPlaying: false,
    positionMs: 0,
    durationMs: 5000,
    didJustFinish: false,
    play: jest.fn(),
    pause: jest.fn(),
    seekToMs: jest.fn(),
    ...state,
  };
  return player;
}

function withPlayer(player: Player) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <PlayerProvider usePlayer={() => player}>{children}</PlayerProvider>;
  };
}

describe('usePlayback', () => {
  it('exposes position and duration from the player', async () => {
    const player = makePlayer({ positionMs: 2000, durationMs: 5000 });
    const { result } = await renderHook(() => usePlayback('file:///a.wav'), {
      wrapper: withPlayer(player),
    });

    expect(result.current.positionMs).toBe(2000);
    expect(result.current.durationMs).toBe(5000);
  });

  it('plays when paused and pauses when playing', async () => {
    const paused = makePlayer({ isPlaying: false });
    const a = await renderHook(() => usePlayback('file:///a.wav'), {
      wrapper: withPlayer(paused),
    });
    a.result.current.toggle();
    expect(paused.play).toHaveBeenCalledTimes(1);

    const playing = makePlayer({ isPlaying: true });
    const b = await renderHook(() => usePlayback('file:///a.wav'), {
      wrapper: withPlayer(playing),
    });
    b.result.current.toggle();
    expect(playing.pause).toHaveBeenCalledTimes(1);
  });

  it('seeks in milliseconds through the gateway', async () => {
    const player = makePlayer();
    const { result } = await renderHook(() => usePlayback('file:///a.wav'), {
      wrapper: withPlayer(player),
    });

    result.current.seekTo(3000);
    expect(player.seekToMs).toHaveBeenCalledWith(3000);
  });

  it('resets to the start when playback finishes', async () => {
    const player = makePlayer({ didJustFinish: true });
    await renderHook(() => usePlayback('file:///a.wav'), { wrapper: withPlayer(player) });

    expect(player.seekToMs).toHaveBeenCalledWith(0);
  });

  it('surfaces an error when a control throws', async () => {
    const player = makePlayer();
    (player.play as jest.Mock).mockImplementation(() => {
      throw new Error('missing file');
    });
    const { result, rerender } = await renderHook(() => usePlayback('file:///gone.wav'), {
      wrapper: withPlayer(player),
    });

    result.current.toggle();
    await rerender({});
    expect(result.current.error).toBe(true);
  });
});
