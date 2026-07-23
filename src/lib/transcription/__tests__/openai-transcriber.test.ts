jest.mock('@/lib/env', () => ({ getOpenAiApiKey: jest.fn() }));

import { getOpenAiApiKey } from '@/lib/env';

import { openaiTranscriber } from '../openai-transcriber';

const mockGetKey = getOpenAiApiKey as jest.Mock;
const realFetch = globalThis.fetch;

function mockFetch(impl: () => Promise<unknown>) {
  const fn = jest.fn(impl);
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}

afterEach(() => {
  globalThis.fetch = realFetch;
});

describe('openaiTranscriber', () => {
  it('returns the trimmed transcript on success', async () => {
    mockGetKey.mockReturnValue('sk-test');
    mockFetch(async () => ({ ok: true, json: async () => ({ text: '  hello world  ' }) }));

    expect(await openaiTranscriber.transcribe('file:///a.wav')).toBe('hello world');
  });

  it('returns null on a non-200 response and reports the status', async () => {
    mockGetKey.mockReturnValue('sk-test');
    mockFetch(async () => ({ ok: false, status: 401, json: async () => ({}) }));
    const onDiagnostic = jest.fn();

    expect(await openaiTranscriber.transcribe('file:///a.wav', { onDiagnostic })).toBeNull();
    expect(onDiagnostic).toHaveBeenCalledWith('openai', 'HTTP 401');
  });

  it('returns null on a network error', async () => {
    mockGetKey.mockReturnValue('sk-test');
    mockFetch(async () => {
      throw new Error('network down');
    });

    expect(await openaiTranscriber.transcribe('file:///a.wav')).toBeNull();
  });

  it('aborts a stalled request after the timeout and returns null', async () => {
    jest.useFakeTimers();
    mockGetKey.mockReturnValue('sk-test');
    const fetchFn = jest.fn(
      (_url: string, init: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener('abort', () => reject(new Error('AbortError')));
        }),
    );
    globalThis.fetch = fetchFn as unknown as typeof fetch;

    const pending = openaiTranscriber.transcribe('file:///a.wav');
    jest.advanceTimersByTime(31_000);

    expect(await pending).toBeNull();
    expect(fetchFn.mock.calls[0][1].signal.aborted).toBe(true);
    jest.useRealTimers();
  });

  it('returns null without calling the API when there is no key', async () => {
    mockGetKey.mockReturnValue(null);
    const fetchFn = mockFetch(async () => ({ ok: true, json: async () => ({ text: 'x' }) }));

    expect(await openaiTranscriber.transcribe('file:///a.wav')).toBeNull();
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('returns null for an empty transcript', async () => {
    mockGetKey.mockReturnValue('sk-test');
    mockFetch(async () => ({ ok: true, json: async () => ({ text: '   ' }) }));

    expect(await openaiTranscriber.transcribe('file:///a.wav')).toBeNull();
  });

  it('reports availability from the presence of a key', async () => {
    mockGetKey.mockReturnValue('sk-test');
    expect(await openaiTranscriber.isAvailable()).toBe(true);
    mockGetKey.mockReturnValue(null);
    expect(await openaiTranscriber.isAvailable()).toBe(false);
  });
});
