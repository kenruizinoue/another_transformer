/**
 * Playback gateway. A Player is produced per audio source by a UsePlayer hook
 * implementation; the expo adapter provides the real one and tests inject a
 * fake factory, so playback hooks never import the native audio module.
 */
export interface Player {
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  didJustFinish: boolean;
  play(): void;
  pause(): void;
  seekToMs(ms: number): void;
}

export type UsePlayer = (uri: string | null) => Player;
