import type {
  Recording,
  RecordingStore,
  SaveRecordingInput,
  TranscriptionEngine,
} from '@/lib/domain';
import { makeRecordingTitle } from '@/lib/utils/recording-title';

import type { FileSystemPort } from './filesystem-port';

const INDEX_VERSION = 1;

type IndexShape = {
  version: number;
  recordings: Recording[];
};

export type FileSystemRecordingStoreDeps = {
  fs: FileSystemPort;
  /** Clock, injectable for deterministic tests. */
  now?: () => number;
  /** Id generator, injectable for deterministic tests. */
  generateId?: () => string;
  /** Subdirectory under the document directory. */
  dirName?: string;
};

function ensureTrailingSlash(uri: string): string {
  return uri.endsWith('/') ? uri : `${uri}/`;
}

function extensionOf(uri: string): string {
  const clean = uri.split('?')[0].split('#')[0];
  const name = clean.slice(clean.lastIndexOf('/') + 1);
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
}

function defaultGenerateId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * RecordingStore backed by a FileSystemPort: audio files live in a recordings
 * directory and metadata lives in a JSON index next to them. A missing or
 * corrupt index recovers to an empty list rather than throwing.
 */
export class FileSystemRecordingStore implements RecordingStore {
  private readonly fs: FileSystemPort;
  private readonly now: () => number;
  private readonly generateId: () => string;
  private readonly dirUri: string;
  private readonly indexUri: string;

  constructor(deps: FileSystemRecordingStoreDeps) {
    this.fs = deps.fs;
    this.now = deps.now ?? (() => Date.now());
    this.generateId = deps.generateId ?? defaultGenerateId;
    const base = ensureTrailingSlash(deps.fs.documentDirectory);
    this.dirUri = `${base}${deps.dirName ?? 'recordings'}/`;
    this.indexUri = `${this.dirUri}index.json`;
  }

  async list(): Promise<Recording[]> {
    const recordings = await this.loadIndex();
    return [...recordings].sort((a, b) => b.createdAt - a.createdAt);
  }

  async get(id: string): Promise<Recording | null> {
    const recordings = await this.loadIndex();
    return recordings.find((r) => r.id === id) ?? null;
  }

  async save(input: SaveRecordingInput): Promise<Recording> {
    await this.fs.ensureDir(this.dirUri);
    const recordings = await this.loadIndex();

    const createdAt = input.createdAt ?? this.now();
    const id = this.generateId();
    const title =
      input.title?.trim() ||
      makeRecordingTitle(
        createdAt,
        recordings.map((r) => r.title),
      );

    const ext = extensionOf(input.fileUri) || 'wav';
    const destUri = `${this.dirUri}${id}.${ext}`;
    if (input.fileUri !== destUri) {
      await this.fs.moveFile(input.fileUri, destUri);
    }

    const record: Recording = {
      id,
      title,
      createdAt,
      durationMs: input.durationMs,
      fileUri: destUri,
    };
    await this.saveIndex([...recordings, record]);
    return record;
  }

  async rename(id: string, title: string): Promise<Recording> {
    const trimmed = title.trim();
    if (!trimmed) {
      throw new Error('Recording title cannot be empty');
    }
    return this.update(id, (record) => ({ ...record, title: trimmed }));
  }

  async setTranscript(
    id: string,
    transcript: string,
    engine: TranscriptionEngine,
  ): Promise<Recording> {
    return this.update(id, (record) => ({
      ...record,
      transcript,
      transcriptEngine: engine,
    }));
  }

  async remove(id: string): Promise<void> {
    const recordings = await this.loadIndex();
    const target = recordings.find((r) => r.id === id);
    if (!target) {
      return; // idempotent: nothing to remove
    }
    try {
      await this.fs.deleteFile(target.fileUri);
    } catch {
      // A missing audio file should not block removing the index entry.
    }
    await this.saveIndex(recordings.filter((r) => r.id !== id));
  }

  private async update(
    id: string,
    change: (record: Recording) => Recording,
  ): Promise<Recording> {
    const recordings = await this.loadIndex();
    const index = recordings.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error(`Recording not found: ${id}`);
    }
    const updated = change(recordings[index]);
    const next = [...recordings];
    next[index] = updated;
    await this.saveIndex(next);
    return updated;
  }

  private async loadIndex(): Promise<Recording[]> {
    try {
      if (!(await this.fs.exists(this.indexUri))) {
        return [];
      }
      const raw = await this.fs.readText(this.indexUri);
      const parsed = JSON.parse(raw) as IndexShape;
      if (!parsed || !Array.isArray(parsed.recordings)) {
        return [];
      }
      return parsed.recordings;
    } catch {
      return []; // missing or corrupt index recovers to empty
    }
  }

  private async saveIndex(recordings: Recording[]): Promise<void> {
    await this.fs.ensureDir(this.dirUri);
    const payload: IndexShape = { version: INDEX_VERSION, recordings };
    await this.fs.writeText(this.indexUri, JSON.stringify(payload));
  }
}
