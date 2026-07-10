import AsyncStorage from '@react-native-async-storage/async-storage';

import type { TranscriptionEngine } from '@/lib/domain';

const KEY = 'transcribe-engine';

/**
 * Where transcription happens:
 *  - "apple"   on-device Apple Speech (iOS), free and offline. Default.
 *  - "whisper" on-device Whisper, best local quality, one-time model download.
 *  - "openai"  cloud, uses your OpenAI key.
 */
export async function getTranscribePreference(): Promise<TranscriptionEngine> {
  const value = await AsyncStorage.getItem(KEY);
  if (value === 'openai') return 'openai';
  if (value === 'whisper') return 'whisper';
  // "apple", legacy values, or unset default to on-device Apple Speech.
  return 'apple';
}

export async function setTranscribePreference(engine: TranscriptionEngine): Promise<void> {
  await AsyncStorage.setItem(KEY, engine);
}
