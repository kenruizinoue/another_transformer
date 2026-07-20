import { act, renderHook } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import * as Print from 'expo-print';

import type { Recording } from '@/lib/domain';
import { makeRecording } from '@/test-utils/store';

import { useTranscriptActions } from '../use-transcript-actions';

describe('useTranscriptActions', () => {
  it('copies the stored transcript and reports Copied', async () => {
    const recording = makeRecording({ transcript: 'meeting notes' });
    const { result } = await renderHook(() => useTranscriptActions(recording));

    await act(async () => {
      await result.current.copy();
    });

    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('meeting notes');
    expect(result.current.copied).toBe(true);
  });

  it('is a no-op without a transcript', async () => {
    const { result } = await renderHook(() => useTranscriptActions(makeRecording()));

    await act(async () => {
      await result.current.copy();
    });
    result.current.exportPdf();

    expect(Clipboard.setStringAsync).not.toHaveBeenCalled();
    expect(Print.printToFileAsync).not.toHaveBeenCalled();
  });

  it('resets the Copied feedback when the transcript changes', async () => {
    const first = makeRecording({ transcript: 'v1' });
    const { result, rerender } = await renderHook(
      ({ rec }: { rec: Recording }) => useTranscriptActions(rec),
      { initialProps: { rec: first } },
    );

    await act(async () => {
      await result.current.copy();
    });
    expect(result.current.copied).toBe(true);

    await rerender({ rec: { ...first, transcript: 'v2' } });
    expect(result.current.copied).toBe(false);
  });

  it('exports the transcript as a PDF', async () => {
    const recording = makeRecording({ transcript: 'to export' });
    const { result } = await renderHook(() => useTranscriptActions(recording));

    await act(async () => {
      result.current.exportPdf();
    });

    expect(Print.printToFileAsync).toHaveBeenCalled();
    const html = (Print.printToFileAsync as jest.Mock).mock.calls[0][0].html as string;
    expect(html).toContain('to export');
  });
});
