/**
 * Timestamp and title helpers. Times are shown in the device's local timezone
 * by default; tests inject an explicit IANA zone so they stay deterministic.
 *
 * The device path (no zone argument) deliberately uses plain Date getters
 * instead of Intl: Hermes on iOS ships incomplete Intl.formatToParts support
 * and returned undefined hour/minute parts in release builds. Intl is only
 * used for the injected-zone test path, where the full ICU data exists.
 */

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

type WallClock = { year: number; month: number; day: number; hour: number; minute: number };

function wallClockIn(createdAtMs: number, timeZone?: string): WallClock {
  const date = new Date(createdAtMs);

  if (!timeZone) {
    // Device path: local wall clock straight from Date, no Intl involved.
    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
    };
  }

  // Test path: resolve the wall clock in an explicit IANA zone via Intl.
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  });
  const parts: Record<string, string> = {};
  for (const part of formatter.formatToParts(date)) {
    parts[part.type] = part.value;
  }
  return {
    year: Number(parts.year),
    month: Number(parts.month) - 1,
    // % 24 guards ICU variants that emit "24" for midnight.
    day: Number(parts.day),
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
  };
}

/**
 * Format a timestamp as e.g. "Jul 10, 2026 14:30" in the given IANA timezone,
 * or the device's local timezone when omitted.
 */
export function formatTimestamp(createdAtMs: number, timeZone?: string): string {
  const t = wallClockIn(createdAtMs, timeZone);
  return `${MONTHS[t.month]} ${t.day}, ${t.year} ${pad(t.hour)}:${pad(t.minute)}`;
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
