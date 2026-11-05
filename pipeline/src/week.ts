/**
 * One clock for the whole pipeline: the local date in Amsterdam. The weekly
 * cap, the run keys and the cron path all derive from this, never from UTC.
 */
export const TIME_ZONE = 'Europe/Amsterdam';

export type LocalDate = {year: number; month: number; day: number};

export function amsterdamDate(now: Date): LocalDate {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return {year: get('year'), month: get('month'), day: get('day')};
}

/** `YYYY-MM-DD` in Amsterdam. */
export function amsterdamDateString(now: Date): string {
  const {year, month, day} = amsterdamDate(now);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** ISO 8601 week of a calendar date, e.g. `2026-W46`. */
export function isoWeekOf({year, month, day}: LocalDate): string {
  // Work on the calendar date as if it were UTC midnight; no zone math left.
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = date.getUTCDay() || 7; // Monday 1 ... Sunday 7
  // The Thursday of this week decides which year the week belongs to.
  date.setUTCDate(date.getUTCDate() + 4 - weekday);
  const weekYear = date.getUTCFullYear();
  const yearStart = Date.UTC(weekYear, 0, 1);
  const week = Math.ceil(((date.getTime() - yearStart) / 86_400_000 + 1) / 7);
  return `${weekYear}-W${String(week).padStart(2, '0')}`;
}

export function amsterdamWeekKey(now: Date): string {
  return isoWeekOf(amsterdamDate(now));
}

export type CapRecord = {runKey: string; status: string} | null;

export type CapDecision = {allowed: true} | {allowed: false; reason: string};

/**
 * One draft per Amsterdam ISO week. Any earlier non-dry run in the week blocks,
 * whatever its outcome (created, rejected or failed); a human retries with force.
 */
export function weekCapDecision(existing: CapRecord, force: boolean, week: string): CapDecision {
  if (!existing || force) return {allowed: true};
  return {
    allowed: false,
    reason: `A draft run already exists for ${week} (${existing.runKey}, status ${existing.status}). Use ?force=1 to run again.`,
  };
}
