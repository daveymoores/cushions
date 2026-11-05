import {describe, expect, it} from 'vitest';
import {amsterdamDateString, amsterdamWeekKey, isoWeekOf, weekCapDecision} from '../src/week';

describe('Amsterdam ISO week', () => {
  it('uses the Amsterdam date, not UTC, around midnight', () => {
    // Sunday 23:30 UTC is Monday 00:30 in Amsterdam (CET): a new week there.
    expect(amsterdamWeekKey(new Date('2026-11-08T23:30:00Z'))).toBe('2026-W46');
    expect(amsterdamDateString(new Date('2026-11-08T23:30:00Z'))).toBe('2026-11-09');
    expect(isoWeekOf({year: 2026, month: 11, day: 8})).toBe('2026-W45');
  });

  it('handles summer time', () => {
    // Sunday 22:30 UTC in CEST is Monday 00:30 local.
    expect(amsterdamWeekKey(new Date('2026-07-05T22:30:00Z'))).toBe('2026-W28');
    expect(amsterdamWeekKey(new Date('2026-07-05T21:30:00Z'))).toBe('2026-W27');
  });

  it('handles year boundaries (2026 has 53 ISO weeks)', () => {
    expect(isoWeekOf({year: 2026, month: 12, day: 31})).toBe('2026-W53');
    expect(isoWeekOf({year: 2027, month: 1, day: 1})).toBe('2026-W53');
    expect(isoWeekOf({year: 2027, month: 1, day: 4})).toBe('2027-W01');
    expect(isoWeekOf({year: 2024, month: 12, day: 30})).toBe('2025-W01');
  });

  it('the weekly cron (Monday 06:00 UTC) and a manual run later that week share a key', () => {
    expect(amsterdamWeekKey(new Date('2026-11-09T06:00:00Z'))).toBe(
      amsterdamWeekKey(new Date('2026-11-15T22:59:00Z')),
    );
  });
});

describe('weekly cap', () => {
  it('allows the first run of a week', () => {
    expect(weekCapDecision(null, false, '2026-W46')).toEqual({allowed: true});
  });
  it('blocks a second run in the same week, whatever the first run did', () => {
    for (const status of ['emailed', 'rejected', 'failed', 'started']) {
      const decision = weekCapDecision({runKey: 'runs/x', status}, false, '2026-W46');
      expect(decision.allowed).toBe(false);
    }
  });
  it('force lets a human run again', () => {
    expect(weekCapDecision({runKey: 'runs/x', status: 'emailed'}, true, '2026-W46')).toEqual({allowed: true});
  });
});
