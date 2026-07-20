import { buildTranscriptHtml } from '../transcript-html';

describe('buildTranscriptHtml', () => {
  it('includes the title, date, and transcript paragraphs', () => {
    const html = buildTranscriptHtml({
      title: 'Team sync',
      createdAt: Date.UTC(2026, 6, 10, 14, 30),
      transcript: 'First paragraph.\n\nSecond paragraph.',
      timeZone: 'UTC',
    });

    expect(html).toContain('<h1>Team sync</h1>');
    expect(html).toContain('Jul 10, 2026 14:30');
    expect(html).toContain('<p>First paragraph.</p>');
    expect(html).toContain('<p>Second paragraph.</p>');
  });

  it('escapes HTML in the title and transcript', () => {
    const html = buildTranscriptHtml({
      title: 'A & B <script>',
      createdAt: 0,
      transcript: 'x < y & z > w',
    });

    expect(html).toContain('A &amp; B &lt;script&gt;');
    expect(html).toContain('x &lt; y &amp; z &gt; w');
    expect(html).not.toContain('<script>');
  });

  it('handles a very long transcript', () => {
    const long = Array.from({ length: 500 }, (_, i) => `Line ${i}.`).join(' ');
    const html = buildTranscriptHtml({ title: 'Long', createdAt: 0, transcript: long });
    expect(html).toContain('Line 499.');
  });
});
