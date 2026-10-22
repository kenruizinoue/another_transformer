import { File } from 'expo-file-system';

import { wavPeaks } from '@/lib/utils/wav-peaks';

/**
 * Reads a recording from disk and returns its waveform bars, or null when the
 * file is missing or unreadable. The only waveform code that touches the file
 * system; the math lives in the pure wavPeaks helper.
 */
export async function readWaveform(uri: string, bars: number): Promise<number[] | null> {
  try {
    const buffer = await new File(uri).arrayBuffer();
    return wavPeaks(new Uint8Array(buffer), bars);
  } catch {
    return null;
  }
}
