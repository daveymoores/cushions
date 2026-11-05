import {describe, expect, it} from 'vitest';
import {diffNewUrls, INDEXNOW_ENDPOINT, journalUrls, locs, runIndexCheck, sitemapUrls} from '../src/indexnow';
import {KEYS} from '../src/store';
import {makeEnv, routedFetch} from './helpers';

const SITE = 'https://sisuhomeware.com';
const KEY = 'eba79443b09b890dcda1c687ab461b61';

const SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE}/</loc></url>
  <url><loc>${SITE}/journal</loc></url>
  <url><loc>${SITE}/journal/what-is-deadstock-fabric</loc><lastmod>2026-08-19</lastmod></url>
  <url><loc>${SITE}/journal/new-post</loc></url>
  <url><loc>${SITE}/products/ada</loc></url>
  <url><loc>https://other.example/journal/x</loc></url>
  <url><loc>${SITE}/journal/a?b=1&amp;c=2</loc></url>
</urlset>`;

describe('sitemap parsing', () => {
  it('decodes entities in <loc>', () => {
    expect(locs('<loc> a&amp;b </loc><loc>c</loc>')).toEqual(['a&b', 'c']);
  });

  it('keeps only journal post URLs on the site host', () => {
    expect(journalUrls(locs(SITEMAP), SITE)).toEqual([
      `${SITE}/journal/what-is-deadstock-fabric`,
      `${SITE}/journal/new-post`,
      `${SITE}/journal/a?b=1&c=2`,
    ]);
  });

  it('follows a sitemap index into its children, once each', async () => {
    const {fetcher, calls} = routedFetch({
      [`${SITE}/sitemap.xml`]: () =>
        new Response(`<sitemapindex><sitemap><loc>${SITE}/a.xml</loc></sitemap><sitemap><loc>${SITE}/a.xml</loc></sitemap></sitemapindex>`),
      [`${SITE}/a.xml`]: () => new Response(`<urlset><url><loc>${SITE}/journal/x</loc></url></urlset>`),
    });
    expect(await sitemapUrls(fetcher, `${SITE}/sitemap.xml`)).toEqual([`${SITE}/journal/x`]);
    expect(calls).toHaveLength(2);
  });
});

describe('diffNewUrls', () => {
  it('returns only URLs not already known, in sitemap order', () => {
    expect(diffNewUrls(['a', 'b', 'c'], ['b'])).toEqual(['a', 'c']);
    expect(diffNewUrls(['a'], ['a'])).toEqual([]);
    expect(diffNewUrls([], [])).toEqual([]);
  });
});

describe('runIndexCheck', () => {
  it('submits new journal URLs with the key and keyLocation, then remembers them', async () => {
    const env = makeEnv();
    await env.kv.put(KEYS.knownUrls, JSON.stringify([`${SITE}/journal/what-is-deadstock-fabric`]));
    const {fetcher, calls} = routedFetch({
      [`${SITE}/sitemap.xml`]: () => new Response(SITEMAP),
      [`${SITE}/${KEY}.txt`]: () => new Response(KEY),
      [INDEXNOW_ENDPOINT]: () => new Response('', {status: 202}),
    });
    const record = await runIndexCheck(env, fetcher, new Date('2026-11-10T07:00:00Z'));
    expect(record.status).toBe('submitted');
    const post = calls.find((c) => c.url === INDEXNOW_ENDPOINT);
    expect(JSON.parse(post?.init?.body as string)).toEqual({
      host: 'sisuhomeware.com',
      key: KEY,
      keyLocation: `${SITE}/${KEY}.txt`,
      urlList: [`${SITE}/journal/new-post`, `${SITE}/journal/a?b=1&c=2`],
    });
    expect(await env.kv.get(KEYS.knownUrls, 'json')).toHaveLength(3);
    expect(env.kv.data.has(KEYS.indexRun('2026-11-10T07:00:00.000Z'))).toBe(true);
  });

  it('does nothing when nothing is new', async () => {
    const env = makeEnv();
    await env.kv.put(
      KEYS.knownUrls,
      JSON.stringify([`${SITE}/journal/what-is-deadstock-fabric`, `${SITE}/journal/new-post`, `${SITE}/journal/a?b=1&c=2`]),
    );
    const {fetcher, calls} = routedFetch({[`${SITE}/sitemap.xml`]: () => new Response(SITEMAP)});
    expect((await runIndexCheck(env, fetcher, new Date())).status).toBe('nothing_new');
    expect(calls).toHaveLength(1);
  });

  it('does not submit, or remember, when the key file is wrong', async () => {
    const env = makeEnv();
    const {fetcher, calls} = routedFetch({
      [`${SITE}/sitemap.xml`]: () => new Response(SITEMAP),
      [`${SITE}/${KEY}.txt`]: () => new Response('nope', {status: 404}),
    });
    const record = await runIndexCheck(env, fetcher, new Date());
    expect(record.status).toBe('failed');
    expect(calls.some((c) => c.url === INDEXNOW_ENDPOINT)).toBe(false);
    expect(await env.kv.get(KEYS.knownUrls)).toBeNull();
  });

  it('records a refused submission and keeps the URLs for next time', async () => {
    const env = makeEnv();
    const {fetcher} = routedFetch({
      [`${SITE}/sitemap.xml`]: () => new Response(SITEMAP),
      [`${SITE}/${KEY}.txt`]: () => new Response(KEY),
      [INDEXNOW_ENDPOINT]: () => new Response('bad', {status: 422}),
    });
    const record = await runIndexCheck(env, fetcher, new Date());
    expect(record.status).toBe('failed');
    expect(record.response?.status).toBe(422);
    expect(await env.kv.get(KEYS.knownUrls)).toBeNull();
  });
});
