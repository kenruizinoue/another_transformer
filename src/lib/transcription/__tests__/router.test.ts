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
  it('passes the stored language to the engine when the call sets none', async () => {
    const adapters = {
      apple: adapter('apple', { text: 'hola' }),
      whisper: adapter('whisper'),
      openai: adapter('openai'),
    };
    const router = createTranscriptionRouter({
      adapters,
      getPreference: async () => 'apple',
      getLanguage: async () => 'es-MX',
    });

    await router.transcribe('file:///a.wav');

    expect(adapters.apple.transcribe).toHaveBeenCalledWith(
      'file:///a.wav',
      expect.objectContaining({ language: 'es-MX' }),
    );
  });

  it('keeps a language the call sets over the stored one', async () => {
    const adapters = {
      apple: adapter('apple', { text: 'hello' }),
      whisper: adapter('whisper'),
      openai: adapter('openai'),
    };
    const router = createTranscriptionRouter({
      adapters,
      getPreference: async () => 'apple',
      getLanguage: async () => 'es-MX',
    });

    await router.transcribe('file:///a.wav', { language: 'ja-JP' });

    expect(adapters.apple.transcribe).toHaveBeenCalledWith(
      'file:///a.wav',
      expect.objectContaining({ language: 'ja-JP' }),
    );
  });

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

  it('returns a null result with per-engine notes when every engine fails', async () => {
    const adapters = {
      apple: adapter('apple', { text: null }),
      whisper: adapter('whisper', { text: null }),
      openai: adapter('openai', { available: false }),
    };
    const router = makeRouter(adapters, 'apple');

    const result = await router.transcribe('file:///a.wav');
    expect(result.text).toBeNull();
    expect(result.engine).toBeNull();
    if (result.text === null) {
      expect(result.notes).toEqual([
        'apple: returned nothing',
        'whisper: returned nothing',
        'openai: unavailable',
      ]);
    }
  });

  it('keeps adapter-reported diagnostics in the notes', async () => {
    const failing: Transcriber = {
      engine: 'openai',
      isAvailable: jest.fn().mockResolvedValue(true),
      transcribe: jest.fn(async (_uri, options) => {
        options?.onDiagnostic?.('openai', 'HTTP 401');
        return null;
      }),
    };
    const adapters = {
      apple: adapter('apple', { available: false }),
      whisper: adapter('whisper', { available: false }),
      openai: failing,
    };
    const router = makeRouter(adapters, 'openai');

    const result = await router.transcribe('file:///a.wav');
    if (result.text === null) {
      expect(result.notes).toContain('openai: HTTP 401');
      expect(result.notes).toContain('whisper: unavailable');
    }
  });
});
