const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * Format a timestamp deterministically in UTC (no dependency on the device
 * timezone or ICU version), e.g. "Jul 10, 2026 14:30".
 */
export function formatTimestamp(createdAtMs: number): string {
  const date = new Date(createdAtMs);
  return (
    `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()} ` +
    `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`
  );
}

/**
 * Build a default recording title from its creation time, de-duplicated against
 * any existing titles by appending a counter. Deterministic for a given input;
 * an invalid timestamp falls back to a plain base so a title is always produced.
 */
export function makeRecordingTitle(createdAtMs: number, existingTitles: string[] = []): string {
  const base = Number.isFinite(createdAtMs)
    ? `Recording ${formatTimestamp(createdAtMs)}`
    : 'Recording';

  const taken = new Set(existingTitles);
  if (!taken.has(base)) {
    return base;
  }

  let counter = 2;
  while (taken.has(`${base} (${counter})`)) {
    counter += 1;
  }
  return `${base} (${counter})`;
}
