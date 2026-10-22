import { useEffect, useState } from 'react';

import { readWaveform } from '@/lib/adapters/waveform';

/**
 * The waveform bars for a recording file, or null while loading, without a
 * file, or when it cannot be read. The reader is injectable for tests.
 */
export function useWaveform(
  uri: string | null,
  bars: number,
  read: (uri: string, bars: number) => Promise<number[] | null> = readWaveform,
): number[] | null {
  const [peaks, setPeaks] = useState<number[] | null>(null);

  useEffect(() => {
    if (!uri) return;
    let active = true;
    read(uri, bars).then((result) => {
      if (active) setPeaks(result);
    });
    return () => {
      active = false;
    };
  }, [bars, read, uri]);

  return uri ? peaks : null;
}
