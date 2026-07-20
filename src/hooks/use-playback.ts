import { useCallback, useEffect, useState } from 'react';

import { usePlayerGateway } from '@/lib/player-context';

export type Playback = {
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  error: boolean;
  toggle: () => void;
  pause: () => void;
  seekTo: (ms: number) => void;
};

/**
 * Playback state and controls for a single audio file over the Player gateway.
 * Resets to the start when playback finishes and surfaces an error flag if a
 * control fails (for example a missing or deleted file).
 */
export function usePlayback(uri: string | null): Playback {
  const player = usePlayerGateway(uri);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (player.didJustFinish) {
      player.seekToMs(0);
    }
  }, [player]);

  const toggle = useCallback(() => {
    try {
      if (player.isPlaying) {
        player.pause();
      } else {
        player.play();
      }
    } catch {
      setError(true);
    }
  }, [player]);

  const pause = useCallback(() => {
    try {
      player.pause();
    } catch {
      setError(true);
    }
  }, [player]);

  const seekTo = useCallback(
    (ms: number) => {
      try {
        player.seekToMs(ms);
      } catch {
        setError(true);
      }
    },
    [player],
  );

  return {
    isPlaying: player.isPlaying,
    positionMs: player.positionMs,
    durationMs: player.durationMs,
    error,
    toggle,
    pause,
    seekTo,
  };
}
