import { useCallback, useEffect, useState } from 'react';

import { copyText } from '@/lib/adapters/clipboard';
import type { Recording } from '@/lib/domain';

import { useExportPdf } from './use-export-pdf';

/**
 * Actions on a recording's stored transcript: copy to the clipboard (with
 * transient Copied feedback that resets when the transcript changes) and PDF
 * export. Reads the transcript from the recording, never from local state.
 */
export function useTranscriptActions(recording: Recording | null) {
  const transcript = recording?.transcript ?? null;
  const [copied, setCopied] = useState(false);
  const { run: runExport, status: exportStatus } = useExportPdf();

  useEffect(() => {
    // Reset the Copied feedback whenever the transcript itself changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCopied(false);
  }, [transcript]);

  const copy = useCallback(async () => {
    if (!transcript) return;
    await copyText(transcript);
    setCopied(true);
  }, [transcript]);

  const exportPdf = useCallback(() => {
    if (recording && transcript) {
      runExport({ ...recording, transcript });
    }
  }, [recording, runExport, transcript]);

  return { transcript, copied, copy, exportPdf, exportStatus };
}
