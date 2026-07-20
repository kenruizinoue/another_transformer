import { formatTimestamp } from '@/lib/utils/recording-title';

export type TranscriptDocument = {
  title: string;
  createdAt: number;
  transcript: string;
  /** IANA timezone for the shown date; defaults to the device zone. */
  timeZone?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Builds a self-contained HTML document for a transcript, ready for
 * Print.printToFileAsync. Pure and separate from the print call so it can be
 * unit-tested. Blank lines split the transcript into paragraphs.
 */
export function buildTranscriptHtml(doc: TranscriptDocument): string {
  const paragraphs = doc.transcript
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br/>')}</p>`)
    .join('\n');

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font-family: -apple-system, system-ui, sans-serif; padding: 32px; color: #111; }
      h1 { font-size: 22px; margin: 0 0 4px; }
      .meta { color: #666; font-size: 13px; margin: 0 0 24px; }
      p { font-size: 15px; line-height: 1.5; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(doc.title)}</h1>
    <p class="meta">${escapeHtml(formatTimestamp(doc.createdAt, doc.timeZone))}</p>
    ${paragraphs}
  </body>
</html>`;
}
