import AsyncStorage from '@react-native-async-storage/async-storage';

import { TRANSCRIBE_LANGUAGES, type TranscribeLanguage, type TranscriptionEngine } from '@/lib/domain';

const KEY = 'transcribe-engine';
const LANGUAGE_KEY = 'transcribe-language';

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

/**
 * The language spoken in the recordings. Every engine receives it: Apple Speech
 * picks its recognizer by locale, Whisper and OpenAI decode for that language.
 * Unset or unknown values default to English.
 */
export async function getTranscribeLanguage(): Promise<TranscribeLanguage> {
  const value = await AsyncStorage.getItem(LANGUAGE_KEY);
  const known = TRANSCRIBE_LANGUAGES.find((language) => language.tag === value);
  return known?.tag ?? 'en-US';
}

export async function setTranscribeLanguage(language: TranscribeLanguage): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_KEY, language);
}
