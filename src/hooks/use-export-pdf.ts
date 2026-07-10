import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useCallback, useState } from 'react';

import type { Recording } from '@/lib/domain';
import { buildTranscriptHtml } from '@/lib/export/transcript-html';

export type ExportStatus = 'idle' | 'exporting' | 'error';

/**
 * Exports a recording's transcript to a PDF and offers it via the share sheet.
 * No-op when there is no transcript; surfaces an error status on failure.
 */
export function useExportPdf() {
  const [status, setStatus] = useState<ExportStatus>('idle');

  const run = useCallback(async (recording: Recording) => {
    if (!recording.transcript) return;
    setStatus('exporting');
    try {
      const html = buildTranscriptHtml({
        title: recording.title,
        createdAt: recording.createdAt,
        transcript: recording.transcript,
      });
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
      }
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  }, []);

  return { status, run };
}
