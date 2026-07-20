import * as Clipboard from 'expo-clipboard';

/** Clipboard adapter so screens and hooks never import the native module. */
export async function copyText(text: string): Promise<void> {
  await Clipboard.setStringAsync(text);
}
