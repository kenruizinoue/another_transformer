jest.mock('@/lib/env', () => ({ getOpenAiApiKey: jest.fn() }));

// Built inside the factory because ES imports hoist above outer consts; plain
// JS inside since babel's mock validator rejects TS annotations here.
jest.mock('expo-file-system/legacy', () => {
  const state = {
    result: { status: 200, body: '{}' },
    cancelled: false,
    lastArgs: [],
    pendingResolve: null,
  };
  return {
    __esModule: true,
    FileSystemUploadType: { MULTIPART: 'multipart' },
    createUploadTask: jest.fn(function () {
      // eslint-disable-next-line prefer-rest-params
      state.lastArgs = Array.prototype.slice.call(arguments);
      return {
        uploadAsync: jest.fn(function () {
          if (state.result === 'hang') {
            return new Promise(function (resolve) {
              state.pendingResolve = resolve;
            });
          }
          return Promise.resolve(state.result);
        }),
        cancelAsync: jest.fn(function () {
          state.cancelled = true;
          if (state.pendingResolve) state.pendingResolve(undefined); // native cancel resolves undefined
          return Promise.resolve();
        }),
      };
    }),
    _state: state,
  };
});

import * as FileSystem from 'expo-file-system/legacy';

import { getOpenAiApiKey } from '@/lib/env';

import { openaiTranscriber } from '../openai-transcriber';

const mockGetKey = getOpenAiApiKey as jest.Mock;
const uploader = FileSystem as unknown as {
  createUploadTask: jest.Mock;
  _state: {
    result: { status: number; body: string } | undefined | 'hang';
    cancelled: boolean;
    lastArgs: unknown[];
  };
};

beforeEach(() => {
  mockGetKey.mockReturnValue('sk-test');
  uploader._state.result = { status: 200, body: '{}' };
  uploader._state.cancelled = false;
});

describe('openaiTranscriber', () => {
  it('uploads the file natively and returns the trimmed transcript', async () => {
    uploader._state.result = { status: 200, body: JSON.stringify({ text: '  hello world  ' }) };

    expect(await openaiTranscriber.transcribe('file:///a.wav')).toBe('hello world');

    const [url, uri, opts] = uploader._state.lastArgs as [string, string, Record<string, unknown>];
    expect(url).toContain('/audio/transcriptions');
    expect(uri).toBe('file:///a.wav');
    expect(opts).toMatchObject({
      uploadType: 'multipart',
      fieldName: 'file',
      mimeType: 'audio/wav',
      parameters: { model: 'gpt-4o-mini-transcribe' },
    });
    expect((opts.headers as Record<string, string>).Authorization).toBe('Bearer sk-test');
  });

  it('returns null on a non-200 response and reports the status', async () => {
    uploader._state.result = { status: 401, body: '{"error":"nope"}' };
    const onDiagnostic = jest.fn();

    expect(await openaiTranscriber.transcribe('file:///a.wav', { onDiagnostic })).toBeNull();
    expect(onDiagnostic).toHaveBeenCalledWith('openai', 'HTTP 401');
  });

  it('cancels a stalled upload after the timeout and returns null', async () => {
    jest.useFakeTimers();
    uploader._state.result = 'hang';
    const onDiagnostic = jest.fn();

    const pending = openaiTranscriber.transcribe('file:///a.wav', { onDiagnostic });
    await jest.advanceTimersByTimeAsync(31_000);

    expect(await pending).toBeNull();
    expect(uploader._state.cancelled).toBe(true);
    expect(onDiagnostic).toHaveBeenCalledWith('openai', expect.stringContaining('timed out'));
    jest.useRealTimers();
  });

  it('returns null without uploading when there is no key', async () => {
    mockGetKey.mockReturnValue(null);
    const onDiagnostic = jest.fn();

    expect(await openaiTranscriber.transcribe('file:///a.wav', { onDiagnostic })).toBeNull();
    expect(uploader.createUploadTask).not.toHaveBeenCalled();
    expect(onDiagnostic).toHaveBeenCalledWith('openai', 'no API key in build');
  });

  it('returns null for an empty transcript', async () => {
    uploader._state.result = { status: 200, body: JSON.stringify({ text: '   ' }) };

    expect(await openaiTranscriber.transcribe('file:///a.wav')).toBeNull();
  });

  it('returns null when the body is not JSON', async () => {
    uploader._state.result = { status: 200, body: 'not json' };
    const onDiagnostic = jest.fn();

    expect(await openaiTranscriber.transcribe('file:///a.wav', { onDiagnostic })).toBeNull();
    expect(onDiagnostic).toHaveBeenCalled();
  });

  it('reports availability from the presence of a key', async () => {
    expect(await openaiTranscriber.isAvailable()).toBe(true);
    mockGetKey.mockReturnValue(null);
    expect(await openaiTranscriber.isAvailable()).toBe(false);
  });
});
