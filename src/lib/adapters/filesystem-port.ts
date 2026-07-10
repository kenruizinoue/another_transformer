/**
 * Minimal file-system port the storage adapter depends on. Keeping the surface
 * this small lets the store be unit-tested against an in-memory fake and keeps
 * the concrete expo-file-system calls in one place.
 */
export interface FileSystemPort {
  /** Document directory uri, ending with a slash. */
  readonly documentDirectory: string;
  ensureDir(dirUri: string): Promise<void>;
  exists(uri: string): Promise<boolean>;
  readText(uri: string): Promise<string>;
  writeText(uri: string, content: string): Promise<void>;
  moveFile(fromUri: string, toUri: string): Promise<void>;
  deleteFile(uri: string): Promise<void>;
}
