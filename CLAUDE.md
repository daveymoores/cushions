# Cushions — working agreement for Claude Code

## Launch checklist

`LAUNCH.md` at the repo root tracks the sisuhomeware.com go-live checklist (deploy, DNS, analytics, deferred items like email). Read it at the start of launch-related work and keep its statuses current as tasks complete.

## Merchant documentation lives in Notion, not this repo

The two merchant-facing docs are **canonical in Notion**, not here. `docs/` holds only a
pointer. If you change anything a merchant can see or edit — a metaobject field, a
hardcoded handle, a fallback string, a nav label, cache behaviour, an image aspect ratio —
**you must update the Notion pages in the same piece of work.** They go stale silently and
the person relying on them is not technical.

Read `docs/NOTION-DOCS.md` for the page IDs, the update procedure, and the list of code
changes that require a doc update. Do not skip it because a change "looks internal".

## Deploys

The GitHub Actions workflow is `on: [push]` with **no branch filter**, so a push to
*any* branch builds and deploys. `main` is bound to the **Production** environment
(`npx shopify hydrogen env list` to confirm); every other branch lands on Preview.
Pushing to main is therefore a production deploy, not just "a deploy" — currently
harmless because the domain still points at the password-protected Online Store,
but that stops being true at go-live.

## Static assets and CSP — the trap that has cost us twice

On Oxygen the built CSS is served from **cdn.shopify.com**, so every `url()` inside
it resolves against that origin rather than the app's. Anything the CSS references
is a cross-origin load, and the CSP directive governing it must list
`https://cdn.shopify.com` — `'self'` does not cover it.

`imgSrc` already lists the CDN, which is why CSS-referenced images have always
worked and hidden the problem. `fontSrc` did not, so a self-hosted woff2 was
blocked and the wordmark silently rendered in the Georgia fallback (fixed
2026-08-27, `app/entry.server.tsx`).

Rules that follow from this:

1. **Fonts and other CSS-referenced assets belong in `app/assets/`**, imported so
   Vite emits them as hashed files — not in `public/`. A `public/` path in CSS
   resolves to the CDN while a hardcoded `/…` preload in `root.tsx` points at the
   app origin: the same file fetched twice, preload never used.
2. **Overrides to `createContentSecurityPolicy` REPLACE a directive's default,
   they don't extend it** — for `imgSrc` and `fontSrc` especially, which have no
   Hydrogen default at all. Re-list `https://cdn.shopify.com` explicitly.
3. **Verify in a browser, not with `curl`.** `curl` doesn't enforce CSP, and a
   successful `fetch()` proves nothing about a font — `fetch` is governed by
   `connectSrc`, font loads by `fontSrc`. The diagnostic that actually works:
   `[...document.fonts].map(f => f.family + ':' + f.status)`; a blocked face
   reads `error`. Then read the `content-security-policy` response header and
   check the specific directive.

This class of failure is always silent: the page renders, the asset just isn't
there. Assume nothing loaded until you have seen it load.

## Orchestrator model

In this repo, act as an **orchestrator**: delegate substantive work to subagents via the Agent tool rather than doing it all inline, and reserve your own context for planning, coordinating, and synthesizing results.

Delegation rules:

1. **Implementation, refactoring, debugging, design, and review** → delegate to the `opus-engineer` agent (pinned to Opus). Give it a self-contained brief: the goal, the relevant file paths, constraints, and how to verify the result.
2. **Code exploration, locating code, mapping data flows, "where/how does X work" questions** → delegate to the `code-scout` agent (pinned to Haiku, read-only). Use it liberally before planning so expensive agents start with a map instead of searching.
3. Run independent subagents **in parallel** (multiple Agent calls in one message) whenever tasks don't depend on each other — e.g. scout several subsystems at once, or implement independent changes concurrently.
4. Trivial work stays inline: single-file reads, one-line edits, running a command, or answering a question you already know from context don't need a subagent.
5. You own the synthesis: verify and integrate what subagents report, resolve conflicts between them, and give the user one coherent summary. Don't relay raw agent output.
