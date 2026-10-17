import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  getTranscribeLanguage,
  getTranscribePreference,
  setTranscribeLanguage,
  setTranscribePreference,
} from '../preference';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('transcribe preference', () => {
  it('defaults to apple when unset', async () => {
    expect(await getTranscribePreference()).toBe('apple');
  });

  it('persists and reads a chosen engine', async () => {
    await setTranscribePreference('whisper');
    expect(await getTranscribePreference()).toBe('whisper');

    await setTranscribePreference('openai');
    expect(await getTranscribePreference()).toBe('openai');
  });

  it('maps legacy or unknown values to apple', async () => {
    await AsyncStorage.setItem('transcribe-engine', 'local');
    expect(await getTranscribePreference()).toBe('apple');
  });
});

describe('transcribe language', () => {
  it('defaults to English when unset', async () => {
    expect(await getTranscribeLanguage()).toBe('en-US');
  });

  it('persists and reads a chosen language', async () => {
    await setTranscribeLanguage('es-MX');
    expect(await getTranscribeLanguage()).toBe('es-MX');

    await setTranscribeLanguage('ja-JP');
    expect(await getTranscribeLanguage()).toBe('ja-JP');
  });

  it('maps unknown values to English', async () => {
    await AsyncStorage.setItem('transcribe-language', 'fr-FR');
    expect(await getTranscribeLanguage()).toBe('en-US');
  });
});
