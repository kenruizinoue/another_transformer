jest.mock('whisper.rn', () => ({ __esModule: true, initWhisper: jest.fn() }));

import { initWhisper } from 'whisper.rn';

import { createWhisperTranscriber } from '../whisper-transcriber';
import type { WhisperModel } from '../whisper-model';

const mockInit = initWhisper as jest.Mock;

function fakeModel(ready: boolean): WhisperModel {
  return { isReady: jest.fn().mockResolvedValue(ready), path: 'file:///m.bin' } as unknown as WhisperModel;
}

function contextReturning(result: string | null) {
  return { transcribe: jest.fn(() => ({ promise: Promise.resolve({ result }) })) };
}

describe('createWhisperTranscriber', () => {
  it('transcribes when the model is ready', async () => {
    mockInit.mockResolvedValue(contextReturning('  hello whisper  '));
    const t = createWhisperTranscriber(fakeModel(true));

    expect(await t.transcribe('file:///a.wav')).toBe('hello whisper');
  });

  it('returns null and never inits when the model is not ready', async () => {
    const t = createWhisperTranscriber(fakeModel(false));

    expect(await t.transcribe('file:///a.wav')).toBeNull();
    expect(mockInit).not.toHaveBeenCalled();
  });

  it('returns null when transcription yields empty text', async () => {
    mockInit.mockResolvedValue(contextReturning('   '));
    const t = createWhisperTranscriber(fakeModel(true));

    expect(await t.transcribe('file:///a.wav')).toBeNull();
  });

  it('returns null when init fails', async () => {
    mockInit.mockRejectedValue(new Error('no context'));
    const t = createWhisperTranscriber(fakeModel(true));

    expect(await t.transcribe('file:///a.wav')).toBeNull();
  });

  it('reports availability from the model readiness', async () => {
    expect(await createWhisperTranscriber(fakeModel(true)).isAvailable()).toBe(true);
    expect(await createWhisperTranscriber(fakeModel(false)).isAvailable()).toBe(false);
  });
});
