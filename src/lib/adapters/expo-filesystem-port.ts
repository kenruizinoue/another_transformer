import * as FileSystem from 'expo-file-system/legacy';

import type { FileSystemPort } from './filesystem-port';

/**
 * Concrete FileSystemPort backed by expo-file-system (legacy API, which is
 * stable in SDK 57). This is the only module that talks to the device file
 * system; everything else depends on the FileSystemPort interface.
 */
export const expoFileSystemPort: FileSystemPort = {
  documentDirectory: FileSystem.documentDirectory ?? '',

  async ensureDir(dirUri: string): Promise<void> {
    const info = await FileSystem.getInfoAsync(dirUri);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true });
    }
  },

  async exists(uri: string): Promise<boolean> {
    return (await FileSystem.getInfoAsync(uri)).exists;
  },

  async readText(uri: string): Promise<string> {
    return FileSystem.readAsStringAsync(uri);
  },

  async writeText(uri: string, content: string): Promise<void> {
    await FileSystem.writeAsStringAsync(uri, content);
  },

  async moveFile(fromUri: string, toUri: string): Promise<void> {
    await FileSystem.moveAsync({ from: fromUri, to: toUri });
  },

  async deleteFile(uri: string): Promise<void> {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  },
};
