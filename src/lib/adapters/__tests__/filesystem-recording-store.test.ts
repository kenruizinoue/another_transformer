import type { FileSystemPort } from '../filesystem-port';
import { FileSystemRecordingStore } from '../filesystem-recording-store';

class FakeFileSystem implements FileSystemPort {
  documentDirectory = 'file:///doc/';
  files = new Map<string, string>();
  dirs = new Set<string>();

  async ensureDir(dirUri: string): Promise<void> {
    this.dirs.add(dirUri);
  }
  async exists(uri: string): Promise<boolean> {
    return this.files.has(uri);
  }
  async readText(uri: string): Promise<string> {
    const value = this.files.get(uri);
    if (value === undefined) throw new Error(`ENOENT: ${uri}`);
    return value;
  }
  async writeText(uri: string, content: string): Promise<void> {
    this.files.set(uri, content);
  }
  async moveFile(fromUri: string, toUri: string): Promise<void> {
    const value = this.files.get(fromUri) ?? '';
    this.files.delete(fromUri);
    this.files.set(toUri, value);
  }
  async deleteFile(uri: string): Promise<void> {
    this.files.delete(uri);
  }
}

function makeStore(fs: FakeFileSystem, startAt = 1000) {
  let id = 0;
  let clock = startAt;
  return new FileSystemRecordingStore({
    fs,
    generateId: () => `id${(id += 1)}`,
    now: () => (clock += 1000),
  });
}

const AUDIO = 'file:///tmp/rec.wav';

describe('FileSystemRecordingStore', () => {
  it('starts empty when there is no index', async () => {
    const store = makeStore(new FakeFileSystem());
    expect(await store.list()).toEqual([]);
  });

  it('saves a recording, moving the file into the recordings dir', async () => {
    const fs = new FakeFileSystem();
    fs.files.set(AUDIO, 'audio-bytes');
    const store = makeStore(fs);

    const rec = await store.save({ fileUri: AUDIO, durationMs: 4200 });

    expect(rec.id).toBe('id1');
    expect(rec.title).toContain('Recording');
    expect(rec.durationMs).toBe(4200);
    expect(rec.fileUri).toBe('file:///doc/recordings/id1.wav');
    expect(fs.files.has(AUDIO)).toBe(false);
    expect(fs.files.get('file:///doc/recordings/id1.wav')).toBe('audio-bytes');
    expect(await store.list()).toHaveLength(1);
  });

  it('uses an explicit title when provided', async () => {
    const fs = new FakeFileSystem();
    const store = makeStore(fs);
    const rec = await store.save({ fileUri: AUDIO, durationMs: 1, title: 'Standup' });
    expect(rec.title).toBe('Standup');
  });

  it('lists recordings newest first and gets by id', async () => {
    const fs = new FakeFileSystem();
    const store = makeStore(fs);
    const a = await store.save({ fileUri: AUDIO, durationMs: 1, createdAt: 100 });
    const b = await store.save({ fileUri: AUDIO, durationMs: 1, createdAt: 300 });
    const c = await store.save({ fileUri: AUDIO, durationMs: 1, createdAt: 200 });

    const list = await store.list();
    expect(list.map((r) => r.id)).toEqual([b.id, c.id, a.id]);
    expect(await store.get(a.id)).toMatchObject({ id: a.id });
    expect(await store.get('missing')).toBeNull();
  });

  it('renames a recording and rejects an empty title', async () => {
    const fs = new FakeFileSystem();
    const store = makeStore(fs);
    const rec = await store.save({ fileUri: AUDIO, durationMs: 1 });

    const renamed = await store.rename(rec.id, '  Team sync  ');
    expect(renamed.title).toBe('Team sync');
    expect((await store.get(rec.id))?.title).toBe('Team sync');

    await expect(store.rename(rec.id, '   ')).rejects.toThrow(/empty/i);
    await expect(store.rename('missing', 'x')).rejects.toThrow(/not found/i);
  });

  it('attaches a transcript with its engine', async () => {
    const fs = new FakeFileSystem();
    const store = makeStore(fs);
    const rec = await store.save({ fileUri: AUDIO, durationMs: 1 });

    const updated = await store.setTranscript(rec.id, 'hello world', 'apple');
    expect(updated.transcript).toBe('hello world');
    expect(updated.transcriptEngine).toBe('apple');
    expect((await store.get(rec.id))?.transcript).toBe('hello world');
  });

  it('removes a recording and its file, and is idempotent', async () => {
    const fs = new FakeFileSystem();
    fs.files.set(AUDIO, 'bytes');
    const store = makeStore(fs);
    const rec = await store.save({ fileUri: AUDIO, durationMs: 1 });

    await store.remove(rec.id);
    expect(await store.list()).toEqual([]);
    expect(fs.files.has(rec.fileUri)).toBe(false);

    await expect(store.remove(rec.id)).resolves.toBeUndefined();
  });

  it('recovers to an empty list when the index is corrupt', async () => {
    const fs = new FakeFileSystem();
    const store = makeStore(fs);
    fs.files.set('file:///doc/recordings/index.json', '{ not valid json');
    expect(await store.list()).toEqual([]);
  });
});
