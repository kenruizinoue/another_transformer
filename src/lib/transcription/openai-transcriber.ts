import type { TranscribeOptions, Transcriber } from '@/lib/domain';
import { getOpenAiApiKey } from '@/lib/env';

const ENDPOINT = 'https://api.openai.com/v1/audio/transcriptions';
const MODEL = 'gpt-4o-mini-transcribe';
// A hung request must not block the router's fallback chain.
const TIMEOUT_MS = 30_000;

/**
 * Cloud transcription via the OpenAI API, called directly from the app with the
 * user's own key (no backend). Returns null on any failure so the router can
 * fall back to another engine.
 */
export const openaiTranscriber: Transcriber = {
  engine: 'openai',

  async isAvailable(): Promise<boolean> {
    return getOpenAiApiKey() !== null;
  },

  async transcribe(fileUri: string, options?: TranscribeOptions): Promise<string | null> {
    const key = getOpenAiApiKey();
    if (!key || !fileUri) {
      options?.onDiagnostic?.('openai', key ? 'no file uri' : 'no API key in build');
      return null;
    }

    const form = new FormData();
    // React Native FormData accepts a file descriptor object here.
    form.append('file', { uri: fileUri, name: 'audio.wav', type: 'audio/wav' } as unknown as Blob);
    form.append('model', MODEL);
    if (options?.language) {
      form.append('language', options.language.split('-')[0]);
    }

    // Abort the request after TIMEOUT_MS so a stalled network resolves null
    // and the engine router can fall back instead of hanging.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}` },
        body: form,
        signal: controller.signal,
      });
      if (!res.ok) {
        options?.onDiagnostic?.('openai', `HTTP ${res.status}`);
        return null;
      }
      const data = (await res.json()) as { text?: unknown };
      const text = typeof data.text === 'string' ? data.text.trim() : '';
      if (!text) options?.onDiagnostic?.('openai', 'empty transcript');
      return text || null;
    } catch (error) {
      // network error, abort, or timeout
      options?.onDiagnostic?.(
        'openai',
        controller.signal.aborted ? `timed out after ${TIMEOUT_MS / 1000}s` : String(error),
      );
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  },
};
