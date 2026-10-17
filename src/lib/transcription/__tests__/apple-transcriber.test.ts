// The mock module is built inside the factory because ES imports hoist above any
// outer const, which would otherwise be read before initialization.
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { Platform } from 'react-native';

import { appleTranscriber } from '../apple-transcriber';

jest.mock('expo-speech-recognition', () => {
  const listeners: Record<string, (event?: unknown) => void> = {};
  const module = {
    getPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
    requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
    addListener: jest.fn((event: string, cb: (e?: unknown) => void) => {
      listeners[event] = cb;
      return { remove: jest.fn() };
    }),
    start: jest.fn(),
    abort: jest.fn(),
    _listeners: listeners,
  };
  return { __esModule: true, ExpoSpeechRecognitionModule: module };
});

const mod = ExpoSpeechRecognitionModule as unknown as {
  getPermissionsAsync: jest.Mock;
  requestPermissionsAsync: jest.Mock;
  start: jest.Mock;
  _listeners: Record<string, (event?: unknown) => void>;
};

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
const originalOS = Platform.OS;

beforeEach(() => {
  mod.getPermissionsAsync.mockResolvedValue({ granted: true });
  mod.requestPermissionsAsync.mockResolvedValue({ granted: true });
  for (const key of Object.keys(mod._listeners)) delete mod._listeners[key];
  Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
});

afterAll(() => {
  Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
});

describe('appleTranscriber', () => {
  it('resolves the recognized transcript', async () => {
    const p = appleTranscriber.transcribe('file:///a.wav');
    await flush();
    expect(mod.start).toHaveBeenCalled();
    // Long recordings depend on continuous mode; without it iOS stops at the
    // first pause.
    expect(mod.start.mock.calls[0][0]).toMatchObject({ continuous: true });

    mod._listeners.result?.({ isFinal: true, results: [{ transcript: 'hello world' }] });
    mod._listeners.end?.();

    expect(await p).toBe('hello world');
  });

  it('accumulates one final per utterance instead of overwriting', async () => {
    const p = appleTranscriber.transcribe('file:///long.wav');
    await flush();

    mod._listeners.result?.({ isFinal: true, results: [{ transcript: 'first sentence.' }] });
    mod._listeners.result?.({ isFinal: true, results: [{ transcript: 'second sentence.' }] });
    mod._listeners.result?.({ isFinal: true, results: [{ transcript: 'third one.' }] });
    mod._listeners.end?.();

    expect(await p).toBe('first sentence. second sentence. third one.');
  });

  it('falls back to the last interim when no final ever arrives', async () => {
    const p = appleTranscriber.transcribe('file:///a.wav');
    await flush();

    mod._listeners.result?.({ isFinal: false, results: [{ transcript: 'partial tex' }] });
    mod._listeners.result?.({ isFinal: false, results: [{ transcript: 'partial text' }] });
    mod._listeners.end?.();

    expect(await p).toBe('partial text');
  });

  it('resolves null when the result is empty', async () => {
    const p = appleTranscriber.transcribe('file:///a.wav');
    await flush();
    mod._listeners.end?.();
    expect(await p).toBeNull();
  });

  it('resolves null on a recognizer error', async () => {
    const p = appleTranscriber.transcribe('file:///a.wav');
    await flush();
    mod._listeners.error?.({});
    expect(await p).toBeNull();
  });

  it('resolves null and never starts when permission is denied', async () => {
    mod.getPermissionsAsync.mockResolvedValue({ granted: false });
    mod.requestPermissionsAsync.mockResolvedValue({ granted: false });

    expect(await appleTranscriber.transcribe('file:///a.wav')).toBeNull();
    expect(mod.start).not.toHaveBeenCalled();
  });

  it('resolves null when unavailable (non-iOS)', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    expect(await appleTranscriber.transcribe('file:///a.wav')).toBeNull();
    expect(mod.start).not.toHaveBeenCalled();
  });

  it('reports availability on iOS', async () => {
    expect(await appleTranscriber.isAvailable()).toBe(true);
  });
});
