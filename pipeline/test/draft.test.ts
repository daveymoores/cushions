import {describe, expect, it, vi} from 'vitest';
import {runDraft} from '../src/draft';
import {handleRequest, handleScheduled, secretMatches, WEEKLY_CRON} from '../src/app';
import {draftArticleVariables} from '../src/shopify';
import {appendTopics, coveredBy, KEYS, pickTopic, type Topic} from '../src/store';
import {amsterdamWeekKey} from '../src/week';
import {makeEnv, noNetwork, routedFetch, sampleBody} from './helpers';

const NOW = new Date('2026-11-09T06:00:00Z');
const SHOP = 'https://gqrjsh-ha.myshopify.com';

function goodBundle() {
  return {
    title: 'How full should a cushion look?',
    slug: 'how-full-should-a-cushion-look',
    meta_description: 'A plain guide to cushion fullness.',
    summary: 'A full cushion looks calmer. Here is how to get there.',
    body_html: sampleBody(),
    pins: [
      {title: 'One', description: 'One.'},
      {title: 'Two', description: 'Two.'},
      {title: 'Three', description: 'Three.'},
    ],
    instagram_caption: 'A full cushion. Link in bio. #cushions',
    newsletter_blurb: 'Our new guide on cushion fullness.',
    confirm_markers: ['Check the fringe colour on Ember'],
  };
}

function shopRoutes(createdBodies: string[]) {
  return routedFetch({
    [`${SHOP}/api/`]: () =>
      Response.json({
        data: {
          products: {
            nodes: [
              {
                handle: 'ada',
                title: 'Ada',
                description: 'Measures 50 × 50cm and comes with a 55cm insert.',
                productType: 'Cushion',
                options: [],
                variants: {nodes: [{title: 'Default Title', price: {amount: '150.0', currencyCode: 'EUR'}}]},
                metafields: [{key: 'trim', value: '100% cotton fringing — navy'}, null],
              },
            ],
          },
          blog: {
            articles: {
              nodes: [
                {handle: 'what-is-deadstock-fabric', title: 'What is deadstock fabric?', contentHtml: '<p>Deadstock is surplus.</p>', publishedAt: ''},
              ],
            },
          },
        },
      }),
    [`${SHOP}/admin/api/`]: (init) => {
      const body = String(init?.body);
      if (body.includes('PipelineBlogs')) {
        return Response.json({data: {blogs: {nodes: [{id: 'gid://shopify/Blog/125607903606', handle: 'journal'}]}}});
      }
      if (body.includes('PipelineArticles')) {
        return Response.json({
          data: {
            blog: {
              articles: {
                nodes: [
                  {handle: 'what-is-deadstock-fabric', title: 'What is deadstock fabric?', isPublished: true},
                  {handle: 'cushion-size-guide', title: 'Cushion size guide: 50 x 50 or 60 x 40?', isPublished: false},
                ],
              },
            },
          },
        });
      }
      createdBodies.push(body);
      return Response.json({
        data: {
          articleCreate: {
            article: {id: 'gid://shopify/Article/987654', handle: 'how-full-should-a-cushion-look', isPublished: false},
            userErrors: [],
          },
        },
      });
    },
    'https://api.resend.com/emails': () => Response.json({id: 'email-1'}),
  });
}

describe('kill switch', () => {
  it('paused stops a draft run before any network, AI or KV write', async () => {
    const env = makeEnv();
    await env.kv.put(KEYS.paused, '1');
    const before = [...env.kv.data.keys()];
    expect(await runDraft(env, noNetwork, NOW, {force: true, dryRun: false, trigger: 'manual'})).toEqual({kind: 'paused'});
    expect([...env.kv.data.keys()]).toEqual(before);
  });

  it('paused stops both crons', async () => {
    const env = makeEnv();
    await env.kv.put(KEYS.paused, '1');
    const spy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network used'));
    await handleScheduled(WEEKLY_CRON, env, NOW);
    await handleScheduled('0 7 * * *', env, NOW);
    expect(spy).not.toHaveBeenCalled();
    expect([...env.kv.data.keys()]).toEqual([KEYS.paused]);
    spy.mockRestore();
  });

  it('POST /pause and /resume flip the key', async () => {
    const env = makeEnv();
    const headers = {'x-pipeline-secret': 'test-secret-value'};
    await handleRequest(new Request('https://w/pause', {method: 'POST', headers}), env);
    expect(await env.kv.get(KEYS.paused)).toBe('1');
    const blocked = await handleRequest(new Request('https://w/run/draft', {method: 'POST', headers}), env);
    expect(blocked.status).toBe(409);
    await handleRequest(new Request('https://w/resume', {method: 'POST', headers}), env);
    expect(await env.kv.get(KEYS.paused)).toBeNull();
  });
});

describe('one draft per Amsterdam week', () => {
  it('blocks a second run in the same week without touching the network', async () => {
    const env = makeEnv();
    await env.kv.put(KEYS.week(amsterdamWeekKey(NOW)), JSON.stringify({runKey: 'runs/earlier', status: 'emailed'}));
    const outcome = await runDraft(env, noNetwork, NOW, {force: false, dryRun: false, trigger: 'cron'});
    expect(outcome.kind).toBe('blocked');
  });

  it('creates one unpublished draft, emails it, then refuses a second run that week', async () => {
    const env = makeEnv({SHOPIFY_ADMIN_TOKEN: 'shpat_test_token', RESEND_API_KEY: 're_test_key'});
    const ai = vi.fn(async () => ({response: JSON.stringify(goodBundle())}));
    env.AI = {run: ai} as unknown as Ai;
    const created: string[] = [];
    const {fetcher, calls} = shopRoutes(created);

    const outcome = await runDraft(env, fetcher, NOW, {force: false, dryRun: false, trigger: 'cron'});
    expect(outcome.kind).toBe('ran');
    if (outcome.kind !== 'ran') return;
    expect(outcome.record.error).toBeUndefined();
    expect(outcome.record.status).toBe('emailed');
    expect(outcome.record.dedupeSource).toBe('admin');
    expect(outcome.record.article?.adminUrl).toBe('https://admin.shopify.com/store/gqrjsh-ha/content/articles/987654');
    expect(ai).toHaveBeenCalledTimes(1);

    // Never published, never updated.
    expect(created).toHaveLength(1);
    const variables = JSON.parse(created[0]!).variables;
    expect(variables.article.isPublished).toBe(false);
    expect(variables.article.tags).toEqual(['journal', 'draft-by-pipeline']);
    expect(calls.every((c) => !/articleUpdate|articlePublish|isPublished":true/.test(String(c.init?.body)))).toBe(true);

    // Review email: plain text, admin link, confirm markers first.
    const email = JSON.parse(String(calls.find((c) => c.url.includes('resend'))?.init?.body));
    expect(email.subject).toBe('Journal draft ready: How full should a cushion look?');
    expect(email.html).toBeUndefined();
    expect(email.text).toContain('content/articles/987654');
    expect(email.text.indexOf('[ ] Check the fringe colour')).toBeLessThan(email.text.indexOf('Summary'));
    expect(email.to).toEqual(['a@example.com', 'b@example.com']);

    const topics = (await env.kv.get(KEYS.topics, 'json')) as Topic[];
    expect(topics[0]?.usedBy).toBe(outcome.record.key);

    const again = await runDraft(env, fetcher, new Date('2026-11-12T10:00:00Z'), {force: false, dryRun: false, trigger: 'manual'});
    expect(again.kind).toBe('blocked');
    // Secrets never land in the run record.
    expect([...env.kv.data.values()].join('')).not.toMatch(/shpat_test_token|re_test_key/);
  });

  it('regenerates with the violations, three attempts in all, then stores a rejected run and emails that', async () => {
    const env = makeEnv({SHOPIFY_ADMIN_TOKEN: 'shpat_test_token', RESEND_API_KEY: 're_test_key'});
    const bad = {...goodBundle(), title: 'Wow!'};
    const ai = vi.fn(async (_model: string, input: {messages: Array<{content: string}>}) => {
      void input;
      return {response: JSON.stringify(bad)};
    });
    env.AI = {run: ai} as unknown as Ai;
    const created: string[] = [];
    const {fetcher, calls} = shopRoutes(created);
    const outcome = await runDraft(env, fetcher, NOW, {force: false, dryRun: false, trigger: 'cron'});
    expect(outcome.kind === 'ran' && outcome.record.status).toBe('rejected');
    expect(ai).toHaveBeenCalledTimes(3);
    const retry = ai.mock.calls[1]?.[1].messages ?? [];
    expect(retry.map((m) => (m as {role?: string}).role)).toEqual(['system', 'user', 'assistant', 'user']);
    expect(retry[2]?.content).toContain('"title":"Wow!"');
    expect(retry[3]?.content).toContain('title contains an exclamation mark');
    expect(created).toHaveLength(0);
    const email = JSON.parse(String(calls.find((c) => c.url.includes('resend'))?.init?.body));
    expect(email.subject).toMatch(/^Journal draft rejected/);
    expect(email.text).toContain('3 times');
    expect(email.text).toContain('add it back with POST /topics');
  });

  it('a dry run skips Shopify Admin and Resend', async () => {
    const env = makeEnv();
    env.AI = {run: async () => ({choices: [{message: {content: JSON.stringify(goodBundle())}}]})} as unknown as Ai;
    const {fetcher, calls} = shopRoutes([]);
    const outcome = await runDraft(env, fetcher, NOW, {force: false, dryRun: true, trigger: 'manual'});
    expect(outcome.kind === 'ran' && outcome.record.status).toBe('dry_run_complete');
    expect(calls.every((c) => c.url.includes('/api/2026-10/graphql.json') && !c.url.includes('/admin/'))).toBe(true);
    expect(env.kv.data.has(KEYS.week(amsterdamWeekKey(NOW)))).toBe(false);
  });

  it('a failed run records the error (redacted) and emails it', async () => {
    const env = makeEnv({SHOPIFY_ADMIN_TOKEN: 'shpat_test_token', RESEND_API_KEY: 're_test_key'});
    const {fetcher, calls} = routedFetch({
      [`${SHOP}/api/`]: () => new Response('down shpat_test_token', {status: 503}),
      'https://api.resend.com/emails': () => Response.json({id: 'e'}),
    });
    const outcome = await runDraft(env, fetcher, NOW, {force: false, dryRun: false, trigger: 'cron'});
    if (outcome.kind !== 'ran') throw new Error('expected a run');
    expect(outcome.record.status).toBe('failed');
    expect(outcome.record.error).toContain('[redacted]');
    expect(outcome.record.error).not.toContain('shpat_test_token');
    expect(calls.some((c) => c.url.includes('resend'))).toBe(true);
  });
});

describe('articleCreate variables', () => {
  it('are always unpublished', () => {
    const v = draftArticleVariables({blogId: 'b', title: 't', handle: 'h', bodyHtml: '<p>x</p>', summary: 's', author: 'Jessie Brewin'});
    expect(v.article.isPublished).toBe(false);
    expect(v.article.author).toEqual({name: 'Jessie Brewin'});
  });
});

describe('topics', () => {
  it('skips topics an existing article covers and picks the next', () => {
    const topics: Topic[] = [
      {title: 'How to style cushions on your sofa', added: ''},
      {title: 'What is jacquard fabric?', added: ''},
    ];
    const {topic, topics: next} = pickTopic(topics, ['How to style cushions on a sofa']);
    expect(topic?.title).toBe('What is jacquard fabric?');
    expect(next[0]?.skipped).toMatch(/covered by/);
  });
  it('does not treat a different sofa question as covered', () => {
    expect(coveredBy('How many cushions should go on a two-seater sofa?', ['How to style cushions on a sofa'])).toBeNull();
  });
  it('appends without duplicates', () => {
    const {topics, added} = appendTopics([{title: 'What is jacquard fabric?', added: ''}], ['what is Jacquard fabric', 'New one?'], NOW);
    expect(added).toBe(1);
    expect(topics).toHaveLength(2);
  });
});

describe('manual endpoints', () => {
  const env = makeEnv();
  it('404 for unknown routes, 401 without the secret', async () => {
    expect((await handleRequest(new Request('https://w/nope'), env)).status).toBe(404);
    expect((await handleRequest(new Request('https://w/run/draft'), env)).status).toBe(404);
    expect((await handleRequest(new Request('https://w/status'), env)).status).toBe(401);
    expect(
      (await handleRequest(new Request('https://w/status', {headers: {'x-pipeline-secret': 'wrong'}}), env)).status,
    ).toBe(401);
  });
  it('refuses everything when no secret is configured', async () => {
    const open = makeEnv({PIPELINE_SECRET: undefined});
    expect((await handleRequest(new Request('https://w/status', {headers: {'x-pipeline-secret': ''}}), open)).status).toBe(401);
  });
  it('POST /topics takes a JSON array of strings', async () => {
    const headers = {'x-pipeline-secret': 'test-secret-value'};
    const bad = await handleRequest(new Request('https://w/topics', {method: 'POST', headers, body: '{"a":1}'}), env);
    expect(bad.status).toBe(400);
    const ok = await handleRequest(new Request('https://w/topics', {method: 'POST', headers, body: '["A new question?"]'}), env);
    expect(await ok.json()).toMatchObject({added: 1});
  });
  it('secretMatches is exact', () => {
    expect(secretMatches('abc', 'abc')).toBe(true);
    expect(secretMatches('abcd', 'abc')).toBe(false);
    expect(secretMatches(null, 'abc')).toBe(false);
  });
});
