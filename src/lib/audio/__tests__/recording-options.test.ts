import { WAV_16K_MONO } from '../recording-options';

// expo-audio is auto-mocked from __mocks__/expo-audio.js.

describe('WAV_16K_MONO', () => {
  it('captures 16 kHz mono WAV', () => {
    expect(WAV_16K_MONO.extension).toBe('.wav');
    expect(WAV_16K_MONO.sampleRate).toBe(16_000);
    expect(WAV_16K_MONO.numberOfChannels).toBe(1);
  });

  it('records linear PCM WAV at 16 bit on iOS', () => {
    expect(WAV_16K_MONO.ios.extension).toBe('.wav');
    expect(WAV_16K_MONO.ios.outputFormat).toBe('lpcm');
    expect(WAV_16K_MONO.ios.linearPCMBitDepth).toBe(16);
  });
});
