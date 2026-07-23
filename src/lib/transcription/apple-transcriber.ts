import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { Platform } from 'react-native';

import type { TranscribeOptions, Transcriber } from '@/lib/domain';

const MIN_WAIT_MS = 30_000;

function available(): boolean {
  return Platform.OS === 'ios' && !!ExpoSpeechRecognitionModule;
}

async function ensurePermission(): Promise<boolean> {
  try {
    const current = await ExpoSpeechRecognitionModule.getPermissionsAsync();
    if (current.granted) return true;
    const requested = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    return !!requested.granted;
  } catch {
    return false;
  }
}

/**
 * On-device transcription via Apple's Speech framework (iOS only), transcribing
 * a recorded file so audio never leaves the phone.
 *
 * Long-audio rules learned on device:
 * - `continuous: true` is required, otherwise iOS finalizes at the first pause
 *   and a 40 second memo transcribes as one sentence.
 * - iOS emits one final result per utterance and each utterance RESETS the
 *   transcript, so finals must be accumulated, never overwritten.
 * - The wait ceiling scales with the audio duration instead of a fixed 30s.
 *
 * Any failure (unsupported device, denied permission, recognizer error, empty
 * result, timeout) resolves to null so the router can fall back.
 */
export const appleTranscriber: Transcriber = {
  engine: 'apple',

  async isAvailable(): Promise<boolean> {
    return available();
  },

  async transcribe(fileUri: string, options?: TranscribeOptions): Promise<string | null> {
    if (!available() || !fileUri) return null;
    if (!(await ensurePermission())) return null;

    const lang = options?.language ?? 'en-US';
    const waitMs = Math.max(MIN_WAIT_MS, (options?.durationMsHint ?? 0) * 3);

    return new Promise<string | null>((resolve) => {
      const finals: string[] = [];
      let interim = '';
      let settled = false;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      const subscriptions: { remove: () => void }[] = [];

      const cleanup = () => {
        for (const sub of subscriptions) {
          try {
            sub.remove();
          } catch {
            // ignore
          }
        }
      };

      const collectedText = () =>
        (finals.length > 0 ? finals.join(' ') : interim).trim();

      const done = (value: string | null) => {
        if (settled) return;
        settled = true;
        if (timeoutId) clearTimeout(timeoutId);
        cleanup();
        try {
          ExpoSpeechRecognitionModule.abort();
        } catch {
          // ignore
        }
        resolve(value);
      };

      subscriptions.push(
        ExpoSpeechRecognitionModule.addListener('result', (event) => {
          const transcript = event?.results?.[0]?.transcript;
          if (typeof transcript !== 'string' || transcript.length === 0) return;
          if (event.isFinal) {
            finals.push(transcript); // one final per utterance; accumulate
            interim = '';
          } else {
            interim = transcript; // partial for the current utterance
          }
        }),
      );
      subscriptions.push(
        ExpoSpeechRecognitionModule.addListener('end', () => done(collectedText() || null)),
      );
      subscriptions.push(
        ExpoSpeechRecognitionModule.addListener('error', () =>
          done(collectedText() || null),
        ),
      );

      try {
        ExpoSpeechRecognitionModule.start({
          lang,
          interimResults: false,
          // Keep recognizing across pauses; without this iOS stops at the
          // first silence and long recordings come back truncated.
          continuous: true,
          requiresOnDeviceRecognition: true,
          audioSource: { uri: fileUri },
        });
      } catch {
        done(null);
        return;
      }

      timeoutId = setTimeout(() => done(collectedText() || null), waitMs);
    });
  },
};
