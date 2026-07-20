import { formatTimestamp, makeRecordingTitle } from '../recording-title';

// 2026-07-10T14:30:00Z
const TS = Date.UTC(2026, 6, 10, 14, 30, 0);

describe('formatTimestamp', () => {
  it('formats in an injected zone deterministically', () => {
    expect(formatTimestamp(TS, 'UTC')).toBe('Jul 10, 2026 14:30');
  });

  it('shows local wall-clock time for the given zone', () => {
    // Mexico City is UTC-6 year round since 2022.
    expect(formatTimestamp(TS, 'America/Mexico_City')).toBe('Jul 10, 2026 08:30');
  });

  it('handles zones with non-hour offsets', () => {
    // Kolkata is UTC+5:30.
    expect(formatTimestamp(TS, 'Asia/Kolkata')).toBe('Jul 10, 2026 20:00');
  });

  it('rolls the date over across midnight', () => {
    // 02:00 UTC on Jul 10 is 20:00 on Jul 9 in Mexico City.
    const early = Date.UTC(2026, 6, 10, 2, 0, 0);
    expect(formatTimestamp(early, 'America/Mexico_City')).toBe('Jul 9, 2026 20:00');
  });

  it('formats midnight as 00, never 24', () => {
    const midnight = Date.UTC(2026, 6, 10, 0, 0, 0);
    expect(formatTimestamp(midnight, 'UTC')).toBe('Jul 10, 2026 00:00');
  });

  it('device path (no zone) never emits undefined and matches the local clock', () => {
    // Regression: Hermes on iOS lacks full Intl.formatToParts, which produced
    // "undefined:undefined" titles. The no-zone path must avoid Intl entirely.
    const out = formatTimestamp(TS);
    expect(out).toMatch(/^[A-Z][a-z]{2} \d{1,2}, \d{4} \d{2}:\d{2}$/);
    const local = new Date(TS);
    const hh = String(local.getHours()).padStart(2, '0');
    const mm = String(local.getMinutes()).padStart(2, '0');
    expect(out.endsWith(`${hh}:${mm}`)).toBe(true);
  });
});

describe('makeRecordingTitle', () => {
  it('builds a title from the creation time in the given zone', () => {
    expect(makeRecordingTitle(TS, [], 'UTC')).toBe('Recording Jul 10, 2026 14:30');
    expect(makeRecordingTitle(TS, [], 'America/Mexico_City')).toBe(
      'Recording Jul 10, 2026 08:30',
    );
  });

  it('is deterministic for the same input', () => {
    expect(makeRecordingTitle(TS, [], 'UTC')).toBe(makeRecordingTitle(TS, [], 'UTC'));
  });

  it('de-duplicates against existing titles with a counter', () => {
    const base = 'Recording Jul 10, 2026 14:30';
    expect(makeRecordingTitle(TS, [base], 'UTC')).toBe(`${base} (2)`);
    expect(makeRecordingTitle(TS, [base, `${base} (2)`], 'UTC')).toBe(`${base} (3)`);
  });

  it('falls back to a plain base for an invalid timestamp', () => {
    expect(makeRecordingTitle(NaN, [], 'UTC')).toBe('Recording');
    expect(makeRecordingTitle(NaN, ['Recording'], 'UTC')).toBe('Recording (2)');
  });
});
