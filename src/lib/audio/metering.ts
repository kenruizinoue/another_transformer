// Below this the input is treated as silence. Speech near the phone sits
// around -30 to -10 dB, so the bars use most of their height for it.
const FLOOR_DB = -60;

/** Maps a recorder metering reading in decibels to a level from 0 to 1. */
export function meteringToLevel(decibels: number): number {
  const level = (decibels - FLOOR_DB) / -FLOOR_DB;
  return Math.round(Math.min(Math.max(level, 0), 1) * 1000) / 1000;
}
