import type {Env} from './env';
import {fetchWithTimeout, TIMEOUT_MS, type FetchLike} from './http';
import {getJson, KEYS, putJson} from './store';

/**
 * Daily check: new /journal/<slug> URLs in the live sitemap go to IndexNow.
 * Mirrors scripts/indexnow.mjs (same sitemap parsing, same key check, same
 * endpoint and payload), but only for journal posts not sent before.
 */
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

const STATUS_MEANING: Record<number, string> = {
  200: 'OK, URLs submitted',
  202: 'Accepted, key validation pending',
  400: 'Bad request',
  403: 'Key not valid (key file not found, or its body does not match)',
  422: 'URLs do not belong to the host, or the key does not match the protocol',
  429: 'Too many requests',
};

const XML_ENTITIES: Record<string, string> = {amp: '&', lt: '<', gt: '>', quot: '"', apos: "'"};

export function locs(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((match) =>
    (match[1] ?? '').replace(/&(amp|lt|gt|quot|apos);/g, (_, name: string) => XML_ENTITIES[name] ?? ''),
  );
}

/** Every page URL in a sitemap, following a sitemap index into its children. */
export async function sitemapUrls(fetcher: FetchLike, url: string, seen = new Set<string>()): Promise<string[]> {
  if (seen.has(url)) return [];
  seen.add(url);
  const response = await fetchWithTimeout(fetcher, url, {method: 'GET'}, TIMEOUT_MS.site);
  if (!response.ok) throw new Error(`GET ${url} returned ${response.status}`);
  const xml = await response.text();
  if (!/<sitemapindex[\s>]/.test(xml)) return locs(xml);
  const urls: string[] = [];
  for (const child of locs(xml)) urls.push(...(await sitemapUrls(fetcher, child, seen)));
  return urls;
}

/** Journal post URLs on the site's host (not the /journal index itself). */
export function journalUrls(urls: string[], siteUrl: string): string[] {
  const host = new URL(siteUrl).host;
  return [
    ...new Set(
      urls.filter((url) => {
        try {
          const u = new URL(url);
          return u.host === host && /^\/journal\/[^/]+\/?$/.test(u.pathname);
        } catch {
          return false;
        }
      }),
    ),
  ];
}

export function diffNewUrls(current: string[], known: string[]): string[] {
  const seen = new Set(known);
  return current.filter((url) => !seen.has(url));
}

export type IndexRunRecord = {
  started: string;
  finished?: string;
  status: 'paused' | 'nothing_new' | 'submitted' | 'failed';
  found: number;
  submitted: string[];
  response?: {status: number; meaning: string; body: string};
  error?: string;
};

export async function runIndexCheck(env: Env, fetcher: FetchLike, now: Date): Promise<IndexRunRecord> {
  const kv = env.SISU_PIPELINE;
  const record: IndexRunRecord = {started: now.toISOString(), status: 'failed', found: 0, submitted: []};
  const key = KEYS.indexRun(record.started);
  try {
    const site = env.SITE_URL.replace(/\/+$/, '');
    const host = new URL(site).host;
    const keyLocation = `${site}/${env.INDEXNOW_KEY}.txt`;

    const current = journalUrls(await sitemapUrls(fetcher, `${site}/sitemap.xml`), site);
    record.found = current.length;
    const known = (await getJson<string[]>(kv, KEYS.knownUrls)) ?? [];
    const fresh = diffNewUrls(current, known);
    if (!fresh.length) {
      record.status = 'nothing_new';
      return record;
    }

    // IndexNow refuses the whole submission if it cannot read the key back.
    const keyResponse = await fetchWithTimeout(fetcher, keyLocation, {method: 'GET'}, TIMEOUT_MS.site);
    const keyBody = keyResponse.ok ? (await keyResponse.text()).trim() : '';
    if (keyBody !== env.INDEXNOW_KEY) {
      throw new Error(`${keyLocation} returned ${keyResponse.status}${keyResponse.ok ? ' with a different body' : ''}`);
    }

    const response = await fetchWithTimeout(
      fetcher,
      INDEXNOW_ENDPOINT,
      {
        method: 'POST',
        headers: {'content-type': 'application/json; charset=utf-8'},
        body: JSON.stringify({host, key: env.INDEXNOW_KEY, keyLocation, urlList: fresh}),
      },
      TIMEOUT_MS.indexnow,
    );
    const body = (await response.text()).trim().slice(0, 500);
    record.response = {status: response.status, meaning: STATUS_MEANING[response.status] ?? response.statusText, body};
    if (!response.ok) throw new Error(`IndexNow returned ${response.status} ${record.response.meaning}`);
    record.submitted = fresh;
    record.status = 'submitted';
    await putJson(kv, KEYS.knownUrls, [...known, ...fresh]);
    return record;
  } catch (error) {
    record.status = 'failed';
    record.error = error instanceof Error ? error.message : String(error);
    return record;
  } finally {
    record.finished = new Date().toISOString();
    await putJson(kv, key, record);
    console.log(JSON.stringify({job: 'index', status: record.status, found: record.found, submitted: record.submitted.length, error: record.error}));
  }
}
