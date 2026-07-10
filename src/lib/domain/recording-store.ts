import type { Recording } from './recording';
import type { TranscriptionEngine } from './transcriber';

/** Fields needed to persist a freshly captured recording. */
export type SaveRecordingInput = {
  fileUri: string;
  durationMs: number;
  /** Optional explicit title; the store generates one when omitted. */
  title?: string;
  /** Optional explicit creation time; defaults to now. */
  createdAt?: number;
};

/**
 * Persistence gateway for recordings. Screens and hooks depend on this
 * interface, never on a concrete storage implementation, so the file-system and
 * index details stay swappable and injectable in tests.
 */
export interface RecordingStore {
  list(): Promise<Recording[]>;
  get(id: string): Promise<Recording | null>;
  save(input: SaveRecordingInput): Promise<Recording>;
  rename(id: string, title: string): Promise<Recording>;
  setTranscript(id: string, transcript: string, engine: TranscriptionEngine): Promise<Recording>;
  remove(id: string): Promise<void>;
}
