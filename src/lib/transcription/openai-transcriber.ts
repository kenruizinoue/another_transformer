import * as FileSystem from 'expo-file-system/legacy';

import type { TranscribeOptions, Transcriber } from '@/lib/domain';
import { getOpenAiApiKey } from '@/lib/env';

const ENDPOINT = 'https://api.openai.com/v1/audio/transcriptions';
const MODEL = 'gpt-4o-mini-transcribe';
// A hung request must not block the router's fallback chain; scale with the
// audio length since long files upload and process slower.
const MIN_TIMEOUT_MS = 30_000;

/**
 * Cloud transcription via the OpenAI API, called directly from the app with the
 * user's own key (no backend). Uses expo-file-system's native multipart
 * uploader: Expo SDK 57's WinterCG fetch rejects React Native's classic
 * FormData file parts ("Unsupported FormDataPart implementation"), so fetch
 * cannot upload files here. Returns null on any failure so the router can fall
 * back to another engine.
 */
export const openaiTranscriber: Transcriber = {
  engine: 'openai',

  async isAvailable(): Promise<boolean> {
    return getOpenAiApiKey() !== null;
  },

  async transcribe(fileUri: string, options?: TranscribeOptions): Promise<string | null> {
    const key = getOpenAiApiKey();
    if (!key || !fileUri) {
      options?.onDiagnostic?.('openai', key ? 'no file uri' : 'no API key in build');
      return null;
    }

    const language = options?.language?.split('-')[0];
    const waitMs = Math.max(MIN_TIMEOUT_MS, (options?.durationMsHint ?? 0) * 3);

    const task = FileSystem.createUploadTask(ENDPOINT, fileUri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'file',
      mimeType: 'audio/wav',
      parameters: { model: MODEL, ...(language ? { language } : {}) },
      headers: { Authorization: `Bearer ${key}` },
    });

    const timeoutId = setTimeout(() => {
      task.cancelAsync().catch(() => {});
    }, waitMs);

    try {
      const res = await task.uploadAsync();
      if (!res) {
        options?.onDiagnostic?.('openai', `timed out after ${Math.round(waitMs / 1000)}s`);
        return null;
      }
      if (res.status !== 200) {
        options?.onDiagnostic?.('openai', `HTTP ${res.status}`);
        return null;
      }
      const data = JSON.parse(res.body) as { text?: unknown };
      const text = typeof data.text === 'string' ? data.text.trim() : '';
      if (!text) options?.onDiagnostic?.('openai', 'empty transcript');
      return text || null;
    } catch (error) {
      options?.onDiagnostic?.('openai', String(error));
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  },
};
