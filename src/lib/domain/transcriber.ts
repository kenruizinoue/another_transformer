/**
 * Transcription domain contracts. Concrete engines live in lib/adapters and are
 * selected by a router. Every engine returns a string on success or null on any
 * failure so the router can fall back to the next engine.
 */

export type TranscriptionEngine = 'apple' | 'whisper' | 'openai';

export type TranscribeOptions = {
  /** BCP-47 language tag, e.g. "en-US". */
  language?: string;
  /** Length of the audio, so engines can scale their own timeouts. */
  durationMsHint?: number;
  /**
   * Optional failure attribution: engines report WHY they produced no text
   * (HTTP status, permission, empty result) so total failures are diagnosable
   * on release builds where no console exists.
   */
  onDiagnostic?: (engine: TranscriptionEngine, detail: string) => void;
};

export interface Transcriber {
  readonly engine: TranscriptionEngine;
  /** Whether this engine can run on the current device/config. */
  isAvailable(): Promise<boolean>;
  /** Transcribe an audio file. Resolves null on any failure. */
  transcribe(fileUri: string, options?: TranscribeOptions): Promise<string | null>;
}
