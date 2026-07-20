import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

import type { Player } from '@/lib/domain';

/**
 * The real Player over expo-audio. The only playback code that touches the
 * native audio module; times are exposed in milliseconds.
 */
export function useExpoPlayer(uri: string | null): Player {
  const player = useAudioPlayer(uri ? { uri } : null);
  const status = useAudioPlayerStatus(player);

  return {
    isPlaying: status?.playing ?? false,
    positionMs: Math.max(0, Math.round((status?.currentTime ?? 0) * 1000)),
    durationMs: Math.max(0, Math.round((status?.duration ?? 0) * 1000)),
    didJustFinish: status?.didJustFinish ?? false,
    play() {
      player.play();
    },
    pause() {
      player.pause();
    },
    seekToMs(ms: number) {
      player.seekTo(ms / 1000);
    },
  };
}
