export type WhisperModelState = 'unknown' | 'not-downloaded' | 'downloading' | 'ready' | 'error';

/** File operations the Whisper model manager needs; injectable for tests. */
export interface ModelFiles {
  readonly modelPath: string;
  exists(path: string): Promise<boolean>;
  download(url: string, path: string, onProgress?: (fraction: number) => void): Promise<boolean>;
  remove(path: string): Promise<void>;
}

// ggml base English model (~57 MB), enough for on-device speech.
export const WHISPER_MODEL_URL =
  'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin';

/**
 * Manages the on-device Whisper model file: whether it is present, downloading
 * it once with progress, and removing it. A download failure leaves the state in
 * 'error' and isReady false so callers fall back to another engine.
 */
export class WhisperModel {
  private state: WhisperModelState = 'unknown';

  constructor(
    private readonly files: ModelFiles,
    private readonly url: string = WHISPER_MODEL_URL,
  ) {}

  get path(): string {
    return this.files.modelPath;
  }

  getState(): WhisperModelState {
    return this.state;
  }

  async isReady(): Promise<boolean> {
    if (this.state === 'ready') return true;
    const exists = await this.files.exists(this.files.modelPath);
    this.state = exists ? 'ready' : 'not-downloaded';
    return exists;
  }

  async ensureReady(onProgress?: (fraction: number) => void): Promise<boolean> {
    if (await this.isReady()) return true;
    this.state = 'downloading';
    try {
      const ok = await this.files.download(this.url, this.files.modelPath, onProgress);
      this.state = ok ? 'ready' : 'error';
      return ok;
    } catch {
      this.state = 'error';
      return false;
    }
  }

  async remove(): Promise<void> {
    await this.files.remove(this.files.modelPath);
    this.state = 'not-downloaded';
  }
}
