import { useCallback, useState } from 'react';

import { printAndShareHtml } from '@/lib/adapters/pdf-share';
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
      await printAndShareHtml(html);
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  }, []);

  return { status, run };
}
