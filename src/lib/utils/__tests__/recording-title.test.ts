import { formatTimestamp, makeRecordingTitle } from '../recording-title';

// 2026-07-10T14:30:00Z
const TS = Date.UTC(2026, 6, 10, 14, 30, 0);

describe('formatTimestamp', () => {
  it('formats a timestamp in UTC deterministically', () => {
    expect(formatTimestamp(TS)).toBe('Jul 10, 2026 14:30');
  });
});

describe('makeRecordingTitle', () => {
  it('builds a title from the creation time', () => {
    expect(makeRecordingTitle(TS)).toBe('Recording Jul 10, 2026 14:30');
  });

  it('is deterministic for the same input', () => {
    expect(makeRecordingTitle(TS)).toBe(makeRecordingTitle(TS));
  });

  it('de-duplicates against existing titles with a counter', () => {
    const base = 'Recording Jul 10, 2026 14:30';
    expect(makeRecordingTitle(TS, [base])).toBe(`${base} (2)`);
    expect(makeRecordingTitle(TS, [base, `${base} (2)`])).toBe(`${base} (3)`);
  });

  it('falls back to a plain base for an invalid timestamp', () => {
    expect(makeRecordingTitle(NaN)).toBe('Recording');
    expect(makeRecordingTitle(NaN, ['Recording'])).toBe('Recording (2)');
  });
});
