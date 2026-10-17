import type { TranscribeOptions, Transcriber, TranscriptionEngine } from '@/lib/domain';

export type TranscriptionResult =
  | { text: string; engine: TranscriptionEngine }
  | { text: null; engine: null; notes: string[] };

// Fallback chain: the preferred engine first, then the rest in this order.
const FALLBACK_ORDER: TranscriptionEngine[] = ['whisper', 'apple', 'openai'];

function engineOrder(preferred: TranscriptionEngine): TranscriptionEngine[] {
  return [preferred, ...FALLBACK_ORDER.filter((engine) => engine !== preferred)];
}

export type TranscriptionRouterDeps = {
  adapters: Record<TranscriptionEngine, Transcriber>;
  getPreference: () => Promise<TranscriptionEngine>;
  /** Language of the recordings; used when a call does not set one. */
  getLanguage?: () => Promise<string>;
};

/**
 * Routes a transcription to the preferred engine, falling back through the
 * remaining engines when one is unavailable or returns nothing. Reports which
 * engine produced the transcript, or a null result when every engine fails.
 */
export function createTranscriptionRouter(deps: TranscriptionRouterDeps) {
  return {
    async transcribe(fileUri: string, options?: TranscribeOptions): Promise<TranscriptionResult> {
      // Collect per-engine failure reasons so a total failure is diagnosable
      // even in release builds with no console.
      const notes: string[] = [];
      const language = options?.language ?? (await deps.getLanguage?.());
      const trackedOptions: TranscribeOptions = {
        ...options,
        ...(language ? { language } : {}),
        onDiagnostic: (engine, detail) => {
          notes.push(`${engine}: ${detail}`);
          options?.onDiagnostic?.(engine, detail);
        },
      };

      const preferred = await deps.getPreference();
      for (const engine of engineOrder(preferred)) {
        const adapter = deps.adapters[engine];
        if (!adapter || !(await adapter.isAvailable())) {
          notes.push(`${engine}: unavailable`);
          continue;
        }
        const text = await adapter.transcribe(fileUri, trackedOptions);
        if (text) {
          return { text, engine };
        }
        if (!notes.some((note) => note.startsWith(`${engine}:`))) {
          notes.push(`${engine}: returned nothing`);
        }
      }
      return { text: null, engine: null, notes };
    },
  };
}
