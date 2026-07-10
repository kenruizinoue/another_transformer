import type { Transcriber, TranscriptionEngine } from '@/lib/domain';

import { createTranscriptionRouter } from '../router';

function adapter(
  engine: TranscriptionEngine,
  { available = true, text = null as string | null } = {},
): Transcriber {
  return {
    engine,
    isAvailable: jest.fn().mockResolvedValue(available),
    transcribe: jest.fn().mockResolvedValue(text),
  };
}

function makeRouter(
  adapters: Record<TranscriptionEngine, Transcriber>,
  preferred: TranscriptionEngine = 'apple',
) {
  return createTranscriptionRouter({ adapters, getPreference: async () => preferred });
}

describe('createTranscriptionRouter', () => {
  it('uses the preferred engine when it succeeds', async () => {
    const adapters = {
      apple: adapter('apple', { text: 'from apple' }),
      whisper: adapter('whisper', { text: 'from whisper' }),
      openai: adapter('openai', { text: 'from openai' }),
    };
    const router = makeRouter(adapters, 'apple');

    expect(await router.transcribe('file:///a.wav')).toEqual({ text: 'from apple', engine: 'apple' });
    expect(adapters.whisper.transcribe).not.toHaveBeenCalled();
    expect(adapters.openai.transcribe).not.toHaveBeenCalled();
  });

  it('falls back when the preferred engine is unavailable', async () => {
    const adapters = {
      apple: adapter('apple', { text: 'from apple' }),
      whisper: adapter('whisper', { available: false }),
      openai: adapter('openai', { text: 'from openai' }),
    };
    const router = makeRouter(adapters, 'whisper');

    expect(await router.transcribe('file:///a.wav')).toEqual({ text: 'from apple', engine: 'apple' });
    expect(adapters.whisper.transcribe).not.toHaveBeenCalled();
  });

  it('falls back when the preferred engine returns nothing', async () => {
    const adapters = {
      apple: adapter('apple', { text: 'from apple' }),
      whisper: adapter('whisper', { text: null }),
      openai: adapter('openai', { text: 'from openai' }),
    };
    const router = makeRouter(adapters, 'whisper');

    expect(await router.transcribe('file:///a.wav')).toEqual({ text: 'from apple', engine: 'apple' });
    expect(adapters.whisper.transcribe).toHaveBeenCalled();
  });

  it('returns a null result when every engine fails', async () => {
    const adapters = {
      apple: adapter('apple', { text: null }),
      whisper: adapter('whisper', { text: null }),
      openai: adapter('openai', { available: false }),
    };
    const router = makeRouter(adapters, 'apple');

    expect(await router.transcribe('file:///a.wav')).toEqual({ text: null, engine: null });
  });
});
