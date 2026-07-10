import { WAV_16K_MONO } from '../recording-options';

// jest hoists this mock above the import at runtime.
jest.mock('expo-audio', () => ({
  RecordingPresets: {
    HIGH_QUALITY: {
      extension: '.m4a',
      sampleRate: 44_100,
      numberOfChannels: 2,
      bitRate: 128_000,
      ios: { audioQuality: 96 },
      android: {},
      web: {},
    },
  },
  IOSOutputFormat: { LINEARPCM: 'lpcm' },
  AudioQuality: { HIGH: 96 },
}));

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
