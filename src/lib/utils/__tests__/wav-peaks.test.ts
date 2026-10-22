import { wavPeaks } from '../wav-peaks';

// Builds a 16-bit PCM WAV in memory, optionally with an extra chunk before the
// data (iOS writes a FLLR padding chunk there).
function makeWav(samples: number[], { channels = 1, filler = 0, dataSize }: { channels?: number; filler?: number; dataSize?: number } = {}) {
  const dataBytes = samples.length * 2;
  const fillerBytes = filler ? 8 + filler : 0;
  const buffer = new ArrayBuffer(12 + 24 + fillerBytes + 8 + dataBytes);
  const view = new DataView(buffer);
  const ascii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  };
  ascii(0, 'RIFF');
  view.setUint32(4, buffer.byteLength - 8, true);
  ascii(8, 'WAVE');
  ascii(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, channels, true);
  view.setUint32(24, 16_000, true);
  view.setUint32(28, 16_000 * 2 * channels, true);
  view.setUint16(32, 2 * channels, true);
  view.setUint16(34, 16, true);
  let offset = 36;
  if (filler) {
    ascii(offset, 'FLLR');
    view.setUint32(offset + 4, filler, true);
    offset += 8 + filler;
  }
  ascii(offset, 'data');
  view.setUint32(offset + 4, dataSize ?? dataBytes, true);
  samples.forEach((sample, i) => view.setInt16(offset + 8 + i * 2, sample, true));
  return new Uint8Array(buffer);
}

describe('wavPeaks', () => {
  it('returns one loudness value per bar, scaled so the loudest bar is 1', () => {
    const quiet = Array(100).fill(0);
    const loud = Array.from({ length: 100 }, (_, i) => (i % 2 ? 8000 : -8000));
    const peaks = wavPeaks(makeWav([...quiet, ...loud]), 4);

    expect(peaks).toEqual([0, 0, 1, 1]);
  });

  it('skips extra chunks before the audio data', () => {
    const samples = [...Array(50).fill(0), ...Array(50).fill(4000)];

    expect(wavPeaks(makeWav(samples, { filler: 4044 }), 2)).toEqual([0, 1]);
  });

  it('reads past a data size the recorder never finalized', () => {
    const samples = [...Array(50).fill(0), ...Array(50).fill(4000)];

    expect(wavPeaks(makeWav(samples, { dataSize: 0 }), 2)).toEqual([0, 1]);
    expect(wavPeaks(makeWav(samples, { dataSize: 0xffffffff }), 2)).toEqual([0, 1]);
  });

  it('returns all zeros for silence instead of dividing by zero', () => {
    expect(wavPeaks(makeWav(Array(40).fill(0)), 4)).toEqual([0, 0, 0, 0]);
  });

  it('returns null for anything that is not 16-bit PCM WAV', () => {
    expect(wavPeaks(new Uint8Array([1, 2, 3, 4]), 4)).toBeNull();
    const float = makeWav(Array(10).fill(0));
    new DataView(float.buffer).setUint16(34, 32, true);
    expect(wavPeaks(float, 4)).toBeNull();
  });
});
