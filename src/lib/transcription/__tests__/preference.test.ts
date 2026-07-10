import AsyncStorage from '@react-native-async-storage/async-storage';

import { getTranscribePreference, setTranscribePreference } from '../preference';

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
