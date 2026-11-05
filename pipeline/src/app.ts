import {isDryRun, redactRun, runDraft, type RunRecord} from './draft';
import type {Env} from './env';
import type {FetchLike} from './http';
import {runIndexCheck} from './indexnow';
import {appendTopics, getJson, isPaused, KEYS, loadTopics, putJson} from './store';

export const WEEKLY_CRON = '0 6 * * 1';
export const DAILY_CRON = '0 7 * * *';

const fetcher: FetchLike = (input, init) => fetch(input, init);

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {status, headers: {'content-type': 'application/json'}});
}

/** Constant-time comparison so the secret cannot be guessed byte by byte. */
export function secretMatches(given: string | null, expected: string | undefined): boolean {
  if (!expected || !given) return false;
  const a = new TextEncoder().encode(given);
  const b = new TextEncoder().encode(expected);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

type Route = `${string} ${string}`;
const ROUTES = new Set<Route>([
  'POST /run/draft',
  'POST /run/index',
  'GET /status',
  'GET /topics',
  'POST /topics',
  'POST /pause',
  'POST /resume',
]);

export async function handleRequest(request: Request, env: Env, now = new Date()): Promise<Response> {
  const url = new URL(request.url);
  const route = `${request.method} ${url.pathname.replace(/\/+$/, '') || '/'}` as Route;
  if (!ROUTES.has(route)) return json({error: 'not found'}, 404);
  if (!secretMatches(request.headers.get('x-pipeline-secret'), env.PIPELINE_SECRET)) {
    return json({error: 'unauthorised'}, 401);
  }
  const kv = env.SISU_PIPELINE;

  switch (route) {
    case 'POST /run/draft': {
      const outcome = await runDraft(env, fetcher, now, {
        force: url.searchParams.get('force') === '1',
        dryRun: isDryRun(env, url.searchParams.get('dry') === '1'),
        trigger: 'manual',
      });
      if (outcome.kind === 'paused') return json({status: 'paused'}, 409);
      if (outcome.kind === 'blocked') return json({status: 'blocked', reason: outcome.reason}, 409);
      return json({...redactRun(outcome.record), bundle: outcome.record.bundle});
    }
    case 'POST /run/index': {
      if (await isPaused(kv)) {
        console.log(JSON.stringify({job: 'index', status: 'paused'}));
        return json({status: 'paused'}, 409);
      }
      return json(await runIndexCheck(env, fetcher, now));
    }
    case 'GET /status': {
      const list = await kv.list({prefix: 'runs/'});
      const keys = list.keys.map((k) => k.name).sort().reverse().slice(0, 10);
      const runs = await Promise.all(keys.map((k) => getJson<RunRecord>(kv, k)));
      const indexList = await kv.list({prefix: 'index_runs/'});
      const lastIndex = indexList.keys.map((k) => k.name).sort().pop();
      return json({
        paused: await isPaused(kv),
        runs: runs.filter((r): r is RunRecord => !!r).map(redactRun),
        lastIndexRun: lastIndex ? await getJson(kv, lastIndex) : null,
      });
    }
    case 'GET /topics': {
      return json({
        topics: await loadTopics(kv, now),
        suggestions: (await getJson(kv, KEYS.suggestions)) ?? [],
      });
    }
    case 'POST /topics': {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return json({error: 'body must be a JSON array of strings'}, 400);
      }
      if (!Array.isArray(body) || !body.every((t) => typeof t === 'string')) {
        return json({error: 'body must be a JSON array of strings'}, 400);
      }
      const {topics, added} = appendTopics(await loadTopics(kv, now), body as string[], now);
      await putJson(kv, KEYS.topics, topics);
      return json({added, total: topics.length});
    }
    case 'POST /pause':
      await kv.put(KEYS.paused, '1');
      return json({paused: true});
    case 'POST /resume':
      await kv.delete(KEYS.paused);
      return json({paused: false});
  }
  return json({error: 'not found'}, 404);
}

export async function handleScheduled(cron: string, env: Env, now: Date): Promise<void> {
  if (await isPaused(env.SISU_PIPELINE)) {
    console.log(JSON.stringify({job: cron === WEEKLY_CRON ? 'draft' : 'index', status: 'paused'}));
    return;
  }
  if (cron === WEEKLY_CRON) {
    await runDraft(env, fetcher, now, {force: false, dryRun: isDryRun(env), trigger: 'cron'});
  } else if (cron === DAILY_CRON) {
    await runIndexCheck(env, fetcher, now);
  } else {
    console.log(JSON.stringify({job: 'unknown', cron}));
  }
}
