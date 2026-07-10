import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useCallback, useEffect, useState } from 'react';

export type Playback = {
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  error: boolean;
  toggle: () => void;
  seekTo: (ms: number) => void;
};

/**
 * Playback state and controls for a single audio file. Delegates to expo-audio,
 * resets to the start when playback finishes, and surfaces an error flag if a
 * control fails (for example a missing or deleted file).
 */
export function usePlayback(uri: string | null): Playback {
  const player = useAudioPlayer(uri ? { uri } : null);
  const status = useAudioPlayerStatus(player);
  const [error, setError] = useState(false);

  const isPlaying = status?.playing ?? false;
  const positionMs = Math.max(0, Math.round((status?.currentTime ?? 0) * 1000));
  const durationMs = Math.max(0, Math.round((status?.duration ?? 0) * 1000));

  useEffect(() => {
    if (status?.didJustFinish) {
      player.seekTo(0);
    }
  }, [player, status?.didJustFinish]);

  const toggle = useCallback(() => {
    try {
      if (isPlaying) {
        player.pause();
      } else {
        player.play();
      }
    } catch {
      setError(true);
    }
  }, [isPlaying, player]);

  const seekTo = useCallback(
    (ms: number) => {
      try {
        player.seekTo(ms / 1000);
      } catch {
        setError(true);
      }
    },
    [player],
  );

  return { isPlaying, positionMs, durationMs, error, toggle, seekTo };
}
