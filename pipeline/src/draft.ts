import {runModel, type ChatMessage} from './ai';
import {extractJsonObject, extractModelText, parseBundle, type Bundle} from './bundle';
import {failureEmail, rejectedEmail, reviewEmail, sendEmail} from './email';
import {redact, type Env} from './env';
import {buildFactsSheet, fewShotExamples, type JournalPost} from './facts';
import type {FetchLike} from './http';
import {retryPrompt, suggestionsPrompt, systemPrompt, userPrompt} from './prompt';
import {
  createDraftArticle,
  fetchStorefrontFacts,
  findBlogId,
  listAdminArticles,
  type CreatedArticle,
} from './shopify';
import {
  getJson,
  isPaused,
  KEYS,
  loadTopics,
  pickTopic,
  putJson,
  remainingTopics,
  type Suggestion,
  type Topic,
} from './store';
import {validateBundle} from './validate';
import {amsterdamDateString, amsterdamWeekKey, weekCapDecision, type CapRecord} from './week';

export type RunStatus =
  | 'started'
  | 'generating'
  | 'article_created'
  | 'emailed'
  | 'rejected'
  | 'dry_run_complete'
  | 'failed';

export type Attempt = {model: string; violations: string[]; rawExcerpt?: string};

export type RunRecord = {
  key: string;
  week: string;
  localDate: string;
  started: string;
  finished?: string;
  trigger: 'cron' | 'manual';
  dryRun: boolean;
  forced: boolean;
  status: RunStatus;
  step: string;
  dedupeSource?: 'admin' | 'storefront';
  topic?: string;
  suggestions?: string[];
  warnings: string[];
  attempts: Attempt[];
  bundle?: Bundle;
  sanitize?: {removedTags: string[]; removedAttributes: number};
  article?: CreatedArticle;
  emailId?: string;
  error?: string;
};

export type DraftOutcome =
  | {kind: 'paused'}
  | {kind: 'blocked'; reason: string}
  | {kind: 'ran'; record: RunRecord};

export type DraftOptions = {force: boolean; dryRun: boolean; trigger: 'cron' | 'manual'};

/** Generation attempts per run. Two was not enough: both dry runs on 2026-11-05 failed twice. */
export const MAX_ATTEMPTS = 3;

export function isDryRun(env: Env, requested = false): boolean {
  return requested || env.DRY_RUN === '1';
}

export async function runDraft(env: Env, fetcher: FetchLike, now: Date, options: DraftOptions): Promise<DraftOutcome> {
  const kv = env.SISU_PIPELINE;
  if (await isPaused(kv)) {
    console.log(JSON.stringify({job: 'draft', status: 'paused'}));
    return {kind: 'paused'};
  }

  const week = amsterdamWeekKey(now);
  const dryRun = options.dryRun;
  // Dry runs create nothing, so they neither count toward nor respect the cap.
  if (!dryRun) {
    const existing = await getJson<CapRecord>(kv, KEYS.week(week));
    const decision = weekCapDecision(existing, options.force, week);
    if (!decision.allowed) {
      console.log(JSON.stringify({job: 'draft', status: 'blocked', week}));
      return {kind: 'blocked', reason: decision.reason};
    }
  }

  const record: RunRecord = {
    key: KEYS.run(now.toISOString()),
    week,
    localDate: amsterdamDateString(now),
    started: now.toISOString(),
    trigger: options.trigger,
    dryRun,
    forced: options.force,
    status: 'started',
    step: 'start',
    warnings: [],
    attempts: [],
  };
  const save = async (step: string, status: RunStatus = record.status) => {
    record.step = step;
    record.status = status;
    await putJson(kv, record.key, record);
    if (!dryRun) await putJson(kv, KEYS.week(week), {runKey: record.key, status});
  };
  await save('start');

  let topicsState: Topic[] = [];
  let pickedIndex = -1;
  try {
    // 1. What already exists. Admin sees drafts; Storefront only sees published posts.
    const {products, articles: liveArticles} = await fetchStorefrontFacts(env, fetcher);
    let posts: JournalPost[];
    if (!dryRun && env.SHOPIFY_ADMIN_TOKEN) {
      let blogId = await kv.get(KEYS.blogId);
      if (!blogId) {
        blogId = await findBlogId(env, fetcher);
        await kv.put(KEYS.blogId, blogId);
      }
      const adminArticles = await listAdminArticles(env, fetcher, blogId);
      posts = adminArticles.map((a) => ({
        handle: a.handle,
        title: a.title,
        url: `${env.SITE_URL}/journal/${a.handle}`,
        published: a.isPublished,
      }));
      record.dedupeSource = 'admin';
    } else {
      if (!dryRun) throw new Error('SHOPIFY_ADMIN_TOKEN is not set; cannot check for existing drafts');
      posts = liveArticles.map((a) => ({
        handle: a.handle,
        title: a.title,
        url: `${env.SITE_URL}/journal/${a.handle}`,
        published: true,
      }));
      record.dedupeSource = 'storefront';
      record.warnings.push('Dry run: slug and topic dedupe used the Storefront API, which cannot see unpublished drafts.');
    }
    await save('existing_articles');

    // 2. Topic.
    topicsState = await loadTopics(kv, now);
    const picked = pickTopic(topicsState, posts.map((p) => p.title));
    topicsState = picked.topics;
    if (!dryRun) await putJson(kv, KEYS.topics, topicsState);
    pickedIndex = picked.topic ? topicsState.findIndex((t) => t.title === picked.topic?.title) : -1;

    // 2b. Topic ideas when the backlog runs low; never added to topics by code.
    const remainingAfter = remainingTopics(topicsState) - (picked.topic ? 1 : 0);
    if (remainingAfter < 3) {
      record.suggestions = await suggestTopics(env, posts.map((p) => p.title), topicsState.map((t) => t.title), record);
      if (record.suggestions.length && !dryRun) {
        const stored = (await getJson<Suggestion[]>(kv, KEYS.suggestions)) ?? [];
        stored.push(...record.suggestions.map((title) => ({title, suggested: now.toISOString(), runKey: record.key})));
        await putJson(kv, KEYS.suggestions, stored);
      }
    }
    if (!picked.topic) throw new Error('The topic backlog is empty. Add topics with POST /topics.');
    record.topic = picked.topic.title;
    await save('topic_picked');

    // 3. Facts sheet, built now from the live shop.
    const facts = buildFactsSheet(products, posts);
    const examples = fewShotExamples(liveArticles);
    const knownPaths = [
      '/',
      '/journal',
      '/materials',
      '/atelier',
      '/collections/cushions',
      ...facts.productHandles.map((h) => `/products/${h}`),
      ...posts.filter((p) => p.published).map((p) => `/journal/${p.handle}`),
    ];
    const ctx = {factsCorpus: facts.corpus, existingSlugs: posts.map((p) => p.handle), knownPaths};
    await save('facts_built', 'generating');

    // 4. Generate, validate, regenerate with the violations, up to MAX_ATTEMPTS in all.
    const system: ChatMessage = {role: 'system', content: systemPrompt(facts.text, examples)};
    let violations: string[] = [];
    let last: Bundle | null = null;
    let model = '';
    let previousReply = '';
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const messages: ChatMessage[] =
        attempt === 0
          ? [system, {role: 'user', content: userPrompt(record.topic)}]
          : [
              system,
              {role: 'user', content: userPrompt(record.topic)},
              {role: 'assistant', content: previousReply},
              {role: 'user', content: retryPrompt(record.topic, violations)},
            ];
      const reply = await runModel(env, messages);
      model = reply.model;
      const fellBack = reply.attempts.filter((a) => a.error);
      if (fellBack.length) record.warnings.push(...fellBack.map((a) => `${a.model} failed: ${a.error}`));
      let bundle: Bundle;
      try {
        previousReply = extractModelText(reply.raw).slice(0, 30_000);
        bundle = parseBundle(reply.raw);
      } catch (error) {
        violations = [(error as Error).message];
        record.attempts.push({model, violations, rawExcerpt: previousReply.slice(0, 2_000)});
        await save(`generated_${attempt + 1}`);
        continue;
      }
      const result = validateBundle(bundle, ctx);
      last = result.bundle;
      violations = result.violations;
      record.attempts.push({model, violations});
      record.bundle = result.bundle;
      record.sanitize = {removedTags: result.sanitize.removedTags, removedAttributes: result.sanitize.removedAttributes};
      await save(`validated_${attempt + 1}`);
      if (result.ok) break;
    }

    if (violations.length) {
      if (!dryRun) {
        markTopicUsed(topicsState, pickedIndex, record.key);
        await putJson(kv, KEYS.topics, topicsState);
        const email = rejectedEmail({
          bundle: last,
          topic: record.topic,
          violations,
          attempts: record.attempts.length,
          suggestions: record.suggestions ?? [],
        });
        record.emailId = await sendEmail(env, fetcher, {...email, idempotencyKey: `${record.key}/rejected`});
      } else {
        console.log(
          JSON.stringify({
            job: 'draft',
            dryRun: true,
            status: 'rejected',
            violations,
            attempts: record.attempts.map((a) => a.violations),
            bundle: last,
          }),
        );
      }
      record.finished = new Date().toISOString();
      await save('rejected', 'rejected');
      return {kind: 'ran', record};
    }

    const bundle = record.bundle as Bundle;
    if (dryRun) {
      console.log(JSON.stringify({job: 'draft', dryRun: true, status: 'ok', model, bundle}));
      record.finished = new Date().toISOString();
      await save('dry_run_complete', 'dry_run_complete');
      return {kind: 'ran', record};
    }

    // 5. Unpublished article in Shopify.
    const blogId = (await kv.get(KEYS.blogId)) as string;
    record.article = await createDraftArticle(env, fetcher, {
      blogId,
      title: bundle.title,
      handle: bundle.slug,
      bodyHtml: bundle.body_html,
      summary: bundle.summary,
      author: env.AUTHOR_NAME || 'Jessie Brewin',
    });
    markTopicUsed(topicsState, pickedIndex, record.key);
    await putJson(kv, KEYS.topics, topicsState);
    await save('article_created', 'article_created');

    // 6. Review email.
    const email = reviewEmail({
      bundle,
      topic: record.topic,
      adminUrl: record.article.adminUrl,
      suggestions: record.suggestions ?? [],
      model,
    });
    record.emailId = await sendEmail(env, fetcher, {...email, idempotencyKey: `${record.key}/review`});
    record.finished = new Date().toISOString();
    await save('emailed', 'emailed');
    console.log(JSON.stringify({job: 'draft', status: 'emailed', slug: bundle.slug}));
    return {kind: 'ran', record};
  } catch (error) {
    const failedStep = record.step;
    record.error = redact(error instanceof Error ? error.message : String(error), env);
    record.finished = new Date().toISOString();
    await save(failedStep, 'failed');
    console.log(JSON.stringify({job: 'draft', status: 'failed', step: failedStep, error: record.error}));
    if (!dryRun) {
      try {
        await sendEmail(env, fetcher, {
          ...failureEmail({runKey: record.key, step: failedStep, error: record.error}),
          idempotencyKey: `${record.key}/failed`,
        });
      } catch (mailError) {
        record.warnings.push(redact(`Failure email not sent: ${(mailError as Error).message}`, env));
        await putJson(kv, record.key, record);
      }
    }
    return {kind: 'ran', record};
  }
}

function markTopicUsed(topics: Topic[], index: number, runKey: string) {
  const topic = topics[index];
  if (topic) topic.usedBy = runKey;
}

async function suggestTopics(env: Env, liveTitles: string[], backlog: string[], record: RunRecord): Promise<string[]> {
  try {
    const reply = await runModel(env, [{role: 'user', content: suggestionsPrompt(liveTitles, backlog)}]);
    const parsed = extractJsonObject(extractModelText(reply.raw)) as {topics?: unknown};
    const topics = Array.isArray(parsed.topics) ? parsed.topics : [];
    return topics.filter((t): t is string => typeof t === 'string' && t.trim() !== '').map((t) => t.trim()).slice(0, 8);
  } catch (error) {
    record.warnings.push(`Topic suggestions failed: ${(error as Error).message}`);
    return [];
  }
}

/** Last N runs for GET /status, without bodies or anything secret. */
export function redactRun(record: RunRecord) {
  return {
    key: record.key,
    week: record.week,
    started: record.started,
    finished: record.finished,
    trigger: record.trigger,
    dryRun: record.dryRun,
    forced: record.forced,
    status: record.status,
    step: record.step,
    topic: record.topic,
    title: record.bundle?.title,
    slug: record.bundle?.slug,
    confirmMarkers: record.bundle?.confirm_markers,
    adminUrl: record.article?.adminUrl,
    violations: record.attempts.map((a) => a.violations.length),
    warnings: record.warnings,
    error: record.error,
  };
}
