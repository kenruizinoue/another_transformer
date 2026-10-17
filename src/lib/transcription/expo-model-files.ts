import * as FileSystem from 'expo-file-system/legacy';

import type { ModelFiles } from './whisper-model';

const DIR = `${FileSystem.documentDirectory ?? ''}whisper/`;
// The English-only model earlier builds downloaded; removed when found so it
// does not sit unused next to the multilingual one.
const LEGACY_MODEL_PATH = `${DIR}ggml-base.en.bin`;

/** Concrete ModelFiles backed by expo-file-system (legacy API). */
export const expoModelFiles: ModelFiles = {
  modelPath: `${DIR}ggml-base.bin`,

  async exists(path: string): Promise<boolean> {
    void FileSystem.deleteAsync(LEGACY_MODEL_PATH, { idempotent: true }).catch(() => {});
    return (await FileSystem.getInfoAsync(path)).exists;
  },

  async download(
    url: string,
    path: string,
    onProgress?: (fraction: number) => void,
  ): Promise<boolean> {
    const info = await FileSystem.getInfoAsync(DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
    }
    const resumable = FileSystem.createDownloadResumable(url, path, {}, (progress) => {
      if (onProgress && progress.totalBytesExpectedToWrite > 0) {
        onProgress(progress.totalBytesWritten / progress.totalBytesExpectedToWrite);
      }
    });
    const result = await resumable.downloadAsync();
    return result?.status === 200;
  },

  async remove(path: string): Promise<void> {
    await FileSystem.deleteAsync(path, { idempotent: true });
  },
};
