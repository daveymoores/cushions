# Sisu journal pipeline

A Cloudflare Worker that writes one journal post a week for sisuhomeware.com.
It saves the post in Shopify as an **unpublished** draft and emails Jessie and
David a review note. Jessie edits and publishes in Shopify admin. The machine
never publishes anything.

- **Weekly** (Monday 06:00 UTC, cron `0 6 * * 1`): pick a topic, build a facts sheet
  from the live shop, have Workers AI write the bundle, check it, create the
  draft article, email the review note.
- **Daily** (07:00 UTC, cron `0 7 * * *`): read `sitemap.xml`, send any new
  `/journal/<slug>` URLs to IndexNow (same behaviour as `scripts/indexnow.mjs`).

Cost: Workers AI and KV are paid for by Cloudflare credits. Resend and Shopify
calls are within their existing plans.

## How a weekly run works

Each step saves the run record to KV (`runs/<ISO time>`) before the next starts.

1. **Stop checks.** If KV `paused` is `1`, exit with no side effects. If a run
   already exists for this ISO week **in Amsterdam time** (`weeks/<YYYY-Www>`),
   stop unless forced. Any earlier run blocks, whatever its outcome
   (emailed, rejected or failed); a human retries with `?force=1`.
2. **What exists.** Products and the live posts from the Storefront API; every
   journal article, drafts included, from the Admin API (the Storefront API
   cannot see drafts).
3. **Topic.** The next unused topic in KV `topics` (seeded from
   `topics.seed.json` when empty). Topics an existing article already covers are
   marked `skipped`. If fewer than 3 remain, the model suggests 8 new ones into
   KV `suggestions` and the email lists them. Suggestions are never added to
   `topics` by code; add the ones you want with `POST /topics`.
4. **Facts sheet.** `facts.json` (confirmed facts, plus the ones marked
   `unknown` that the model is told it does not know) and the live product data
   (sizes, prices, fabrics, trims, descriptions). Product facts are never typed
   into `facts.json`. The prompt says: when two sources disagree (for example
   Ember's fringe, "mushroom" in the description and "camel" in the details),
   do not state it, add a confirm marker.
5. **Generate.** `@cf/openai/gpt-oss-120b`, falling back to
   `@cf/meta/llama-3.3-70b-instruct-fp8-fast`; the run fails, by name, if
   neither answers. Few-shot examples are the live posts as plain text.
6. **Validate** (`src/validate.ts`). Lengths, 600 to 900 words, question
   `h2`s, no em-dash or exclamation mark, no hype words, British spelling, every
   number either in the facts sheet or in a confirm marker, upper-case names
   (certifications) sourced, links only to pages that exist, slug unique against
   every article including drafts. `body_html` is sanitised first (`src/sanitize.ts`):
   only `h2 h3 p ul ol li a strong em`, only `href` on `a`, only site paths or https.
   Spaced dashes are replaced with commas before checking. On failure it
   regenerates with the violations, three attempts in all; if the last one
   still fails, the run is stored as `rejected`, the topic is set aside (add it
   back with `POST /topics` to retry it) and the email says so instead of
   creating an article.
7. **Create** the article with Admin GraphQL `articleCreate` (API `2026-10`),
   `isPublished: false`, tags `journal`, `draft-by-pipeline`, author from
   `AUTHOR_NAME`. The pins, caption and blurb stay in the KV run record.
8. **Email** (Resend, plain text): admin link, confirm markers as a checklist
   first, summary, pins, caption, blurb, topic ideas.

Any error stops the run, is stored (secrets scrubbed) and is emailed.

## Files

| Path | What |
| --- | --- |
| `wrangler.jsonc` | Worker config: crons, AI and KV bindings, vars |
| `facts.json` | Brand and construction facts, each with a source and `confirmed` or `unknown` |
| `topics.seed.json` | First topic backlog (loaded once, when KV `topics` is empty) |
| `src/app.ts` | Manual endpoints and the cron switch |
| `src/draft.ts` | The weekly run |
| `src/indexnow.ts` | The daily run |
| `src/validate.ts`, `src/sanitize.ts` | The checks |

## Manual endpoints

All need the header `x-pipeline-secret`. Anything else is a 404.

| Call | Does |
| --- | --- |
| `POST /run/draft` | Same as the weekly cron. Refuses if this Amsterdam week already has a run, unless `?force=1`. `?dry=1` skips Shopify Admin and Resend. |
| `POST /run/index` | Same as the daily cron |
| `GET /status` | Last 10 runs (no article bodies, no secrets) and the last index run |
| `GET /topics` | The backlog and the suggestions |
| `POST /topics` | Append topics. Body: JSON array of strings |
| `POST /pause`, `POST /resume` | Kill switch on and off |

## Setup: David's commands

Run these from `~/Repositories/cushions/pipeline`, in order. Every step that
creates or changes something in Cloudflare, Shopify or Resend is here and only
here.

1. **Shopify custom app and token** (Shopify admin, by hand).
   Settings → Apps and sales channels → Develop apps → Create an app, name
   `Sisu journal pipeline` → Configuration → Admin API scopes: tick
   `read_content` and `write_content` only → Save → Install app → API
   credentials → reveal the Admin API access token once (starts `shpat_`) and
   keep it for step 5. If admin offers no "Develop apps" button, Shopify has
   moved custom apps to the Dev Dashboard for this store; the scopes are the
   same, but tell Claude before going further, because the token flow differs.
2. **Install.**
   ```zsh
   cd ~/Repositories/cushions/pipeline && npm install
   ```
3. **KV namespace.** Then paste the printed `id` over
   `REPLACE_WITH_KV_NAMESPACE_ID` in `wrangler.jsonc`.
   ```zsh
   npx wrangler kv namespace create SISU_PIPELINE
   ```
4. **Vars in `wrangler.jsonc`.** Replace the three placeholders:
   `PUBLIC_STOREFRONT_API_TOKEN` (the same public token as
   `PUBLIC_STOREFRONT_API_TOKEN` in the storefront's `.env`), `REVIEW_TO`
   (Jessie's and your address, comma separated), `REVIEW_FROM` (a sender on a
   domain verified in Resend, for example `Sisu journal <journal@sisuhomeware.com>`).
   In Resend, keep open and click tracking off for that domain.
5. **Secrets.** Each command prompts for the value; nothing lands in shell history.
   The first one asks whether to create the Worker, because it is not deployed
   yet: answer `y`.
   ```zsh
   npx wrangler secret put SHOPIFY_ADMIN_TOKEN
   npx wrangler secret put RESEND_API_KEY
   openssl rand -hex 32   # copy this; it is PIPELINE_SECRET
   npx wrangler secret put PIPELINE_SECRET
   ```
6. **Deploy.** Note the `workers.dev` URL it prints.
   ```zsh
   npx wrangler deploy
   ```
7. **First forced dry run** (writes nothing to Shopify, sends no email; the
   bundle comes back in the response and is stored in KV).
   ```zsh
   read -rs "PIPELINE_SECRET?Pipeline secret: "
   W="https://sisu-journal-pipeline.<your-subdomain>.workers.dev"
   curl -sS -X POST "${W}/run/draft?force=1&dry=1" -H "x-pipeline-secret: ${PIPELINE_SECRET}" > dry-run.json
   curl -sS "${W}/status" -H "x-pipeline-secret: ${PIPELINE_SECRET}"
   ```
8. **First real draft** (creates one unpublished article and emails you both).
   Skip this to let Monday's cron do it.
   ```zsh
   curl -sS -X POST "${W}/run/draft" -H "x-pipeline-secret: ${PIPELINE_SECRET}"
   ```

### Kill switch

Either of these stops both crons and the manual run endpoints at once:

```zsh
npx wrangler kv key put --binding SISU_PIPELINE --remote paused 1
curl -sS -X POST "${W}/pause" -H "x-pipeline-secret: ${PIPELINE_SECRET}"
```

And to resume:

```zsh
npx wrangler kv key delete --binding SISU_PIPELINE --remote paused
curl -sS -X POST "${W}/resume" -H "x-pipeline-secret: ${PIPELINE_SECRET}"
```

Jessie cannot run these herself; she asks David.

### Adding topics

```zsh
curl -sS -X POST "${W}/topics" -H "x-pipeline-secret: ${PIPELINE_SECRET}" \
  -H "content-type: application/json" -d '["How do you choose cushions for an armchair?"]'
```

## Local development

```zsh
npm run typecheck
npm test
npx wrangler dev --test-scheduled --var PUBLIC_STOREFRONT_API_TOKEN:<public token> --var DRY_RUN:1
curl "http://localhost:8787/__scheduled?cron=0+6+*+*+1"
```

`wrangler dev` keeps KV local and runs Workers AI remotely (it bills real
inference to the account). `DRY_RUN=1` skips every Shopify Admin call and every
email; slug and topic dedupe then use the Storefront API, which cannot see
drafts, and the run record says so.

## Not in v1

Search Console queries as a topic source, Pinterest posting, social copy as
article metafields, CI deploys.
