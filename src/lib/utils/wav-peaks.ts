/**
 * Loudness bars for a waveform drawing, computed from a 16-bit PCM WAV file
 * (the format the app records). Walks the RIFF chunks instead of assuming a
 * 44 byte header, because iOS pads the header with an extra chunk. Returns one
 * value per bar from 0 to 1, scaled so the loudest bar is 1, or null when the
 * bytes are not 16-bit PCM WAV.
 */
export function wavPeaks(bytes: Uint8Array, bars: number): number[] | null {
  if (bytes.length < 12 || bars < 1) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tag = (offset: number) =>
    String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
  if (tag(0) !== 'RIFF' || tag(8) !== 'WAVE') return null;

  let format: { channels: number; blockAlign: number; bits: number } | null = null;
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const id = tag(offset);
    const size = view.getUint32(offset + 4, true);
    const body = offset + 8;
    if (id === 'fmt ' && body + 16 <= bytes.length) {
      if (view.getUint16(body, true) !== 1) return null; // compressed or float
      format = {
        channels: view.getUint16(body + 2, true),
        blockAlign: view.getUint16(body + 12, true),
        bits: view.getUint16(body + 14, true),
      };
    } else if (id === 'data') {
      if (!format || format.bits !== 16 || format.blockAlign < 2) return null;
      // A recording cut short can leave the size at 0 or past the file end.
      const end = size === 0 || body + size > bytes.length ? bytes.length : body + size;
      return barsFrom(view, body, end, format.blockAlign, bars);
    }
    offset = body + size + (size % 2);
  }
  return null;
}

function barsFrom(view: DataView, start: number, end: number, blockAlign: number, bars: number) {
  const frames = Math.floor((end - start) / blockAlign);
  const perBar = frames / bars;
  // Reading every frame of a long take is wasted work for a 48 bar drawing.
  const step = Math.max(1, Math.floor(perBar / 2000));
  const levels: number[] = [];
  for (let bar = 0; bar < bars; bar += 1) {
    const from = Math.floor(bar * perBar);
    const to = Math.max(from + 1, Math.floor((bar + 1) * perBar));
    let sum = 0;
    let count = 0;
    for (let frame = from; frame < to && frame < frames; frame += step) {
      const sample = view.getInt16(start + frame * blockAlign, true);
      sum += sample * sample;
      count += 1;
    }
    levels.push(count ? Math.sqrt(sum / count) : 0);
  }
  const loudest = Math.max(...levels);
  return levels.map((level) => (loudest ? Math.round((level / loudest) * 1000) / 1000 : 0));
}
