/**
 * Timestamp and title helpers. Times are shown in the device's local timezone
 * by default; tests inject an explicit IANA zone so they stay deterministic
 * regardless of the machine they run on.
 */

/**
 * Format a timestamp as e.g. "Jul 10, 2026 14:30" in the given IANA timezone,
 * or the device's local timezone when omitted.
 */
export function formatTimestamp(createdAtMs: number, timeZone?: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const parts: Record<string, string> = {};
  for (const part of formatter.formatToParts(new Date(createdAtMs))) {
    parts[part.type] = part.value;
  }
  return `${parts.month} ${parts.day}, ${parts.year} ${parts.hour}:${parts.minute}`;
}

/**
 * Build a default recording title from its creation time, de-duplicated against
 * any existing titles by appending a counter. Deterministic for a given input
 * and zone; an invalid timestamp falls back to a plain base so a title is
 * always produced.
 */
export function makeRecordingTitle(
  createdAtMs: number,
  existingTitles: string[] = [],
  timeZone?: string,
): string {
  const base = Number.isFinite(createdAtMs)
    ? `Recording ${formatTimestamp(createdAtMs, timeZone)}`
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
