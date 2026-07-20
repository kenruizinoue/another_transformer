import { expoModelFiles } from './expo-model-files';
import { WhisperModel } from './whisper-model';

/**
 * The app's Whisper model manager. Shared so Settings (download UI) and the
 * whisper engine adapter agree on the model state. Deliberately free of any
 * whisper.rn import so it loads under Jest.
 */
export const whisperModel = new WhisperModel(expoModelFiles);
