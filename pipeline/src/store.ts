import seedTopics from '../topics.seed.json';

/**
 * KV layout (namespace SISU_PIPELINE):
 *   topics              Topic[]: the backlog, seeded from topics.seed.json when empty
 *   suggestions         Suggestion[]: model ideas awaiting a human; never moved into topics by code
 *   runs/<iso time>     RunRecord: one per draft run, rewritten after every step
 *   weeks/<YYYY-Www>    {runKey, status}: the one-per-week cap (Amsterdam weeks)
 *   known_urls          string[]: journal URLs already sent to IndexNow
 *   index_runs/<iso>    IndexRunRecord: one per daily check
 *   journal_blog_id     the Admin gid of the blog with handle `journal`
 *   paused              "1" stops every cron and manual run
 */
export const KEYS = {
  topics: 'topics',
  suggestions: 'suggestions',
  knownUrls: 'known_urls',
  blogId: 'journal_blog_id',
  paused: 'paused',
  run: (iso: string) => `runs/${iso}`,
  week: (week: string) => `weeks/${week}`,
  indexRun: (iso: string) => `index_runs/${iso}`,
} as const;

export type Topic = {title: string; added: string; usedBy?: string; skipped?: string};

export type Suggestion = {title: string; suggested: string; runKey: string};

export async function getJson<T>(kv: KVNamespace, key: string): Promise<T | null> {
  return (await kv.get(key, 'json')) as T | null;
}

export async function putJson(kv: KVNamespace, key: string, value: unknown): Promise<void> {
  await kv.put(key, JSON.stringify(value));
}

export async function isPaused(kv: KVNamespace): Promise<boolean> {
  return (await kv.get(KEYS.paused)) === '1';
}

export function normaliseTopic(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function loadTopics(kv: KVNamespace, now: Date): Promise<Topic[]> {
  const topics = await getJson<Topic[]>(kv, KEYS.topics);
  if (topics && topics.length) return topics;
  const seeded = (seedTopics as string[]).map((title) => ({title, added: now.toISOString()}));
  await putJson(kv, KEYS.topics, seeded);
  return seeded;
}

/** Append new topics, skipping ones already in the backlog. Returns how many were added. */
export function appendTopics(existing: Topic[], titles: string[], now: Date): {topics: Topic[]; added: number} {
  const seen = new Set(existing.map((t) => normaliseTopic(t.title)));
  const topics = [...existing];
  let added = 0;
  for (const raw of titles) {
    const title = raw.trim();
    const key = normaliseTopic(title);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    topics.push({title, added: now.toISOString()});
    added++;
  }
  return {topics, added};
}

const STOP_WORDS = new Set(
  'a an and are as at be by can do does for from good how in is it of on or should the to what when which why with you your'.split(' '),
);

function contentWords(text: string): Set<string> {
  return new Set(
    normaliseTopic(text)
      .split(' ')
      .map((w) => w.replace(/s$/, ''))
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w)),
  );
}

/** Rough "already covered" test: Jaccard overlap of content words. */
export function coveredBy(topic: string, titles: string[], threshold = 0.5): string | null {
  const a = contentWords(topic);
  if (!a.size) return null;
  for (const title of titles) {
    const b = contentWords(title);
    const inter = [...a].filter((w) => b.has(w)).length;
    const union = new Set([...a, ...b]).size;
    if (union && inter / union >= threshold) return title;
  }
  return null;
}

/**
 * Next topic with no run yet. Topics an existing article already covers are
 * marked skipped (so a human sees why) and passed over.
 */
export function pickTopic(topics: Topic[], existingTitles: string[]): {topic: Topic | null; topics: Topic[]} {
  const next = topics.map((t) => ({...t}));
  for (const t of next) {
    if (t.usedBy || t.skipped) continue;
    const covered = coveredBy(t.title, existingTitles);
    if (covered) {
      t.skipped = `covered by "${covered}"`;
      continue;
    }
    return {topic: t, topics: next};
  }
  return {topic: null, topics: next};
}

export function remainingTopics(topics: Topic[]): number {
  return topics.filter((t) => !t.usedBy && !t.skipped).length;
}
