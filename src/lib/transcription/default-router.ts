import { appleTranscriber } from './apple-transcriber';
import { openaiTranscriber } from './openai-transcriber';
import { getTranscribeLanguage, getTranscribePreference } from './preference';
import { createTranscriptionRouter } from './router';
import { whisperModel } from './whisper-model-instance';
import { createWhisperTranscriber } from './whisper-transcriber';

/** The app's real transcription router, wired from the three engines. */
export const defaultRouter = createTranscriptionRouter({
  adapters: {
    apple: appleTranscriber,
    whisper: createWhisperTranscriber(whisperModel),
    openai: openaiTranscriber,
  },
  getPreference: getTranscribePreference,
  getLanguage: getTranscribeLanguage,
});
