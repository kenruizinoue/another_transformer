import { AudioQuality, IOSOutputFormat, RecordingPresets, type RecordingOptions } from 'expo-audio';

/**
 * 16 kHz mono WAV recording options. WAV is required so the on-device Whisper
 * engine can transcribe the file directly, and it also works for Apple Speech
 * and the cloud engine. iOS-first: iOS records linear PCM WAV; other platforms
 * fall back to the high-quality preset.
 */
export const WAV_16K_MONO: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  extension: '.wav',
  sampleRate: 16_000,
  numberOfChannels: 1,
  bitRate: 256_000,
  ios: {
    ...RecordingPresets.HIGH_QUALITY.ios,
    extension: '.wav',
    outputFormat: IOSOutputFormat.LINEARPCM,
    audioQuality: AudioQuality.HIGH,
    sampleRate: 16_000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
};
