import type { TranscriptionEngine } from './transcriber';

/**
 * A saved audio recording and its optional transcript. Audio bytes live on disk
 * at fileUri; this record is the metadata kept in the store's index.
 */
export type Recording = {
  id: string;
  title: string;
  /** Epoch milliseconds when the recording was created. */
  createdAt: number;
  durationMs: number;
  /** Local file uri of the audio file. */
  fileUri: string;
  /** Present once the recording has been transcribed. */
  transcript?: string;
  /** Which engine produced the current transcript. */
  transcriptEngine?: TranscriptionEngine;
};
