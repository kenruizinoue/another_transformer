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

  it('returns null on a non-200 response', async () => {
    mockGetKey.mockReturnValue('sk-test');
    mockFetch(async () => ({ ok: false, json: async () => ({}) }));

    expect(await openaiTranscriber.transcribe('file:///a.wav')).toBeNull();
  });

  it('returns null on a network error', async () => {
    mockGetKey.mockReturnValue('sk-test');
    mockFetch(async () => {
      throw new Error('network down');
    });

    expect(await openaiTranscriber.transcribe('file:///a.wav')).toBeNull();
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
