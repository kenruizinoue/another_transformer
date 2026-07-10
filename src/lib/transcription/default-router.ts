import { appleTranscriber } from './apple-transcriber';
import { expoModelFiles } from './expo-model-files';
import { openaiTranscriber } from './openai-transcriber';
import { getTranscribePreference } from './preference';
import { createTranscriptionRouter } from './router';
import { WhisperModel } from './whisper-model';
import { createWhisperTranscriber } from './whisper-transcriber';

/** The on-device Whisper model, shared so the download screen and the adapter agree. */
export const whisperModel = new WhisperModel(expoModelFiles);

/** The app's real transcription router, wired from the three engines. */
export const defaultRouter = createTranscriptionRouter({
  adapters: {
    apple: appleTranscriber,
    whisper: createWhisperTranscriber(whisperModel),
    openai: openaiTranscriber,
  },
  getPreference: getTranscribePreference,
});
