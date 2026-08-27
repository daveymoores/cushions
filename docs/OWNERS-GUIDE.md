# Sisu — David's operations guide

Infrastructure, deploys, access and DNS for sisuhomeware.com. Written for
**David only** — it assumes a terminal, the repo, and Shopify admin. Originally
set up 19 Aug 2026; narrowed to operations and re-verified against the live
store on **27 Aug 2026**.

**Do not send Jessie here.** The filename predates this rewrite — post-transfer
the "owner" is Jessie, and *her* guide is `docs/SISU-UPDATING-YOUR-SITE.md`.
Content editing has its own docs now:

| Doc | Audience | What it covers |
|---|---|---|
| `docs/SISU-UPDATING-YOUR-SITE.md` | **Jessie** (store owner) | Plain-English, step-by-step: products, spec metafields, homepage metaobject, fabrics, journal, pages, image shapes, what not to rename, what to ask David for |
| `docs/SISU-AGENT-GUIDE.md` | **Jessie's AI assistant** | Reference manual: exact field keys and types, live store inventory, the content/code split, known-broken behaviour, a diagnostic for "my change isn't showing" |

Those two are canonical for anything content-shaped. Where this file touches
content it is deliberately reduced to the facts David needs when Jessie asks
him a question.

---

## 1. The moving parts

| Part | What it is | Where |
|---|---|---|
| **Shopify store "Sisu"** | The shop itself: products, checkout, content. Basic plan. | [admin.shopify.com](https://admin.shopify.com) → store `gqrjsh-ha.myshopify.com` |
| **Hydrogen sales channel** | Hosts the custom site on **Oxygen** (Shopify's hosting). Holds deploys + environment variables. | Shopify admin → Sales channels → Hydrogen → storefront **Sisu** |
| **GitHub repo** | The site's code. Pushing to `main` deploys production automatically. | `daveymoores/cushions` |
| **Cloudflare** | DNS for `sisuhomeware.com` (nothing else — it does not host the site). | [dash.cloudflare.com](https://dash.cloudflare.com) |
| **PostHog** | Analytics (visits, pageviews). EU cloud, project **SISU** (id 252430). | [eu.posthog.com](https://eu.posthog.com) |
| **Hostnet** | Domain registrar only. DNS moved to Cloudflare; just keep the registration renewed. | mijn.hostnet.nl |

The site is **not** a Shopify theme. The Online Store channel and its themes are
installed but inert — the Hydrogen storefront replaces them. Anything Jessie
reads in Shopify's own help about the theme customiser or Online Store →
Navigation has zero effect here.

**Dead / deprecated — do not use:**
- The old dev store `sisu-yswysm5o.myshopify.com` (a Dev-Dashboard development
  store; can never go live). Safe to delete once nothing references it.
- The old Cloudflare Worker deployment ("sisu") — the code that supported it
  was removed from the repo.
- The old Headless-channel API token. Production credentials are now injected
  by Oxygen automatically; local ones come from `npx shopify hydrogen env pull`.
- The default `news` blog in admin (unused; `journal` is the real one).

---

## 2. Is the site public? The go-live switch

**Current state: private.** `LAUNCH.md` still shows the go-live switch as
unticked as of 27 Aug 2026.

- `https://sisuhomeware.com` points at the (unused) Online Store, which sits
  behind Shopify's default password page — visitors see nothing.
- The real site is live at
  `https://sisu-8bbdf3dc78d11fd67dae.o2.myshopify.dev` — that URL requires
  logging in with a Shopify account that has access to the store. Post-transfer
  that includes Jessie, not only David.

**To go public (one dropdown):**
Shopify admin → **Settings → Domains → sisuhomeware.com → Domain target →
Change** → pick **Sisu (Production)** instead of "Online Store". Within minutes
sisuhomeware.com serves the real site to everyone.

To go private again, change the target back to "Online Store".

Two caveats now that Jessie owns the store:

- **Settings → Domains is an owner-area setting.** Whether David's current
  access level can flip the target is **unverified** — see §8. If it is greyed
  out, Jessie does it from her account.
- **The gate is no longer the ownership transfer** (that has been accepted).
  What still stands between here and flipping the switch is the punch list in
  `LAUNCH.md`: real prices, inventory tracking, Delivery/Returns/Contact facts,
  and the open handover items in §8.

⚠️ After cutover, verify the apex serves **200** and not a 301 to
`myshopify.com`. If it still redirects, change the **primary domain** setting,
not just the target.

---

## 3. Content — where it lives, and what David needs to know about it

All content lives in Shopify admin and is read **live from the Storefront API**
at request time. **Content edits never need a deploy.** There is no build step,
no sync job, and no "publish the site" button.

### Caching — the real numbers

Two strategies are in play, and both land in the same place practically:

| Query | Strategy | max-age | stale-while-revalidate |
|---|---|---|---|
| `SITE_CONTENT_QUERY` — the `homepage` metaobject (`app/root.tsx:91-94`) | `CacheShort()` | 1s | 9s |
| Everything else, including `NAV_COLLECTIONS_QUERY` in the same root loader (no `cache` option passed) | Hydrogen default | 1s | 86,399s |

`stale-while-revalidate` means: past the 1-second max-age the next visitor is
served the stale copy **immediately** while a fresh one is fetched in the
background, and the visitor after that gets the fresh copy.

**Practical rule to give Jessie: reload twice.** The first load after an edit
often still shows the old value; the second shows the new one.

⚠️ **Do not describe this as taking a day.** The ~86,399s window is the SWR
tail, not a delay. Its only real effect is that a page untouched for >24h makes
the next visitor wait on a live fetch — and they still get fresh content. This
is **server-side** cache: a hard refresh, a private window, or clearing her
browser cache does nothing.

### Handles hardcoded in the site — never rename these

Renaming or deleting any of these breaks the site silently, with no error
anywhere:

| Handle | Kind | Where it's hardcoded | Failure mode |
|---|---|---|---|
| `journal` | Blog | `journal._index.tsx`, `journal.$handle.tsx`, `[sitemap.xml].tsx` | Whole journal 404s, no fallback |
| `cushions` | Collection | `FEATURED_HANDLE` in `app/routes/_index.tsx:34` | Homepage silently features some other collection |
| `atelier` | Page | `atelier.tsx`; `/pages/atelier` 301s to `/atelier` | Atelier route falls back to a stub |
| `shipping`, `returns`, `contact` | Pages | `components/Footer.tsx` | Footer links 404 |
| `how-a-sisu-cushion-is-made` | Article | `components/Footer.tsx` | Footer link 404s |

Also: Shopify's auto-created `frontpage` collection is hidden by code
(`isVisibleCollection()` in `app/lib/adapters.ts`). Renaming it makes it appear
in the nav and browse grid.

### Facts worth having to hand

- **`homepage` metaobject: 16 fields**, one entry, handle `homepage`. Verified
  live 27 Aug 2026. (An earlier "13 fields" note was wrong.) The field-by-field
  reference is `docs/SISU-AGENT-GUIDE.md` §4 — don't duplicate it here.
- **Product metafields are `custom.front_fabric`, `custom.back_fabric`,
  `custom.trim`, `custom.insert`, `custom.care`.** All five are populated on all
  four products (`renee`, `leonie`, `parker`, `ada`), verified live 27 Aug 2026.
  (An earlier `fiber / origin / loom / care / repair` note was wrong — those
  keys were never in the code.)
- **Blank field ≠ empty section.** Every metaobject field and metafield falls
  back to hardcoded copy when empty. Two of the product fallbacks assert facts
  ("Duck feather, included", "Spot clean recommended"). This is the single most
  common "my edit didn't work" report.
- **Metaobject definitions and the `custom` namespace need Storefront API
  access enabled.** Without it the query returns empty and every field falls
  back globally, with no error. Confirmed enabled on both definitions and the
  namespace on 27 Aug 2026 — a Storefront API read returned data for all of them.
- Mock data is automatic, not a flag: `app/lib/storefront.ts → usesMockData()`
  serves design fixtures only when `PUBLIC_STORE_DOMAIN` is unset or
  `mock.shop`. Production has the real domain injected by Oxygen.

---

## 4. Reading the live store from a terminal

Reads need **no Admin token and no MCP server**. The Storefront API with the
public token already in `.env` returns metaobject field keys and types,
metafield values, and every handle in the store. API version **2026-04**.

```sh
# from the repo root — sources PUBLIC_STORE_DOMAIN + PUBLIC_STOREFRONT_API_TOKEN
set -a; . ./.env; set +a

curl -s "https://$PUBLIC_STORE_DOMAIN/api/2026-04/graphql.json" \
  -H 'Content-Type: application/json' \
  -H "X-Shopify-Storefront-Access-Token: $PUBLIC_STOREFRONT_API_TOKEN" \
  -d '{"query":"{ metaobjects(type:\"homepage\", first:1) { nodes { handle fields { key type value } } } }"}'
```

Swap the query for whatever you need — `products`, `collections`, `pages`,
`blog(handle:\"journal\")`, `metaobjects(type:\"material\")`. If a query comes
back empty for content that exists in admin, the cause is almost always missing
Storefront API access on the definition (§3), not a bad query.

⚠️ Read the token from `.env` via the shell — never hardcode it in a script,
never `echo` it, and never paste it into a chat or an issue.

---

## 5. Deploying

- **Push to `main` → production deploy.** The GitHub Action
  (`.github/workflows/oxygen-deployment-1000171225.yml`) builds and publishes
  to Oxygen. Watch it in the repo's Actions tab or the Hydrogen channel.
- **Any other branch → preview deploy** with its own URL.
- Manual deploy from a terminal: `npx shopify hydrogen deploy`.
- Local dev: `npm run dev` (http://localhost:3000). Production-like run:
  `npm run preview`. Checks: `npm run typecheck`, `npm run lint`.
- **Environment variables** live in the Hydrogen channel (Storefront settings →
  Environments and variables), not the repo:
  - `npx shopify hydrogen env pull` — write them into local `.env`.
    **Re-verified working post-ownership-transfer on 27 Aug 2026** ("No changes
    to your .env file"), so Hydrogen channel + Oxygen access survived the
    transfer.
  - `npx shopify hydrogen env push --env production` — push local `.env` up
    (interactive confirm; run in a real terminal). ⚠️ **Not** re-verified
    post-transfer. It depends on David's permissions including **Apps and
    channels**, which `LAUNCH.md` still lists as unconfirmed (§8).
- To do pure design work locally against fixtures, set
  `PUBLIC_STORE_DOMAIN="mock.shop"` in `.env`.
- ⚠️ **`PUBLIC_SITE_URL` is set in local `.env` but `LAUNCH.md` still lists it
  as unset in Oxygen production.** Canonical URLs, `robots.txt` and the sitemap
  depend on it. Confirm before go-live.
- ⚠️ **CI deploy is unverified post-transfer.** One trivial commit to `main`
  still needs to be pushed to confirm it.
  `OXYGEN_DEPLOYMENT_TOKEN_1000171225` is storefront-scoped rather than
  user-scoped, so it *should* be unaffected — confirm rather than assume.

---

## 6. PostHog (analytics)

- Dashboards: [eu.posthog.com](https://eu.posthog.com) → project **SISU**
  (id 252430, as recorded 19 Aug 2026).
- What's wired: automatic pageviews, including client-side route changes
  (History API capture), in `app/components/PostHogAnalytics.tsx`. Lazy
  extensions (session replay, surveys) are CSP-allow-listed
  (`eu.i.posthog.com`, `eu-assets.i.posthog.com` in `app/entry.server.tsx`).
- Controlled by two env vars: `PUBLIC_POSTHOG_KEY` and `PUBLIC_POSTHOG_HOST`
  (`https://eu.i.posthog.com`). Both are set in Oxygen production and in the
  local `.env`.
- ⚠️ **An empty key silently disables analytics** — no error, just no events.
  If PostHog looks dead, check the key is set in the environment you deployed.

---

## 7. Cloudflare / DNS

Recorded 19 Aug 2026 during the migration; **not re-verified since**. Re-check
in the Cloudflare dashboard before acting on it.

Nameservers: `cullen.ns.cloudflare.com` / `mia.ns.cloudflare.com` (changed at
Hostnet; Hostnet is registrar-only now). SSL/TLS mode: **Full (strict)**.

Records for `sisuhomeware.com`:

| Type | Name | Content | Proxy |
|---|---|---|---|
| A | `sisuhomeware.com` | `23.227.38.65` (Shopify) | **DNS only** |
| CNAME | `www` | `shops.myshopify.com` | **DNS only** |
| TXT | `sisuhomeware.com` | SPF (`v=spf1 …`) | — |
| TXT | `_dmarc` | DMARC (`v=DMARC1; p=reject`) | — |

The two TXT records are as noted on 19 Aug 2026 and sit oddly beside "no
mailbox exists on the domain" — verify them in the dashboard rather than
trusting this table.

⚠️ **The Shopify records must stay grey-cloud (DNS only).** Turning on
Cloudflare's orange-cloud proxy breaks Shopify's TLS certificates — Shopify
flags it as an error. Ignore Cloudflare's "proxying is required" banner.

**Email:** none exists on the domain yet. When wanted, Cloudflare **Email
Routing** gives free forwarding addresses (hello@sisuhomeware.com → Gmail) in
minutes and adds its own MX/SPF records automatically.

---

## 8. Ownership & access — state as of 27 Aug 2026

`LAUNCH.md` → "Ownership handover runbook" is the live checklist. Keep it
current; this section summarises where it stood on 27 Aug 2026.

**Confirmed done:**
- **Jessie Brewin is the store owner.** She accepted the transfer and created
  her own organisation ("Sisu"). Users list on 27 Aug 2026: Jessie Brewin =
  Store owner, David Moores = Administrator, both Active.
- **David retains developer/admin access and is the escalation path for
  anything code-shaped** — deploys, the Hydrogen channel, Oxygen env vars, the
  header nav, footer, homepage section order, site title/meta, the newsletter
  backend.
- **`npx shopify hydrogen env pull` verified working post-transfer** (27 Aug
  2026) — Hydrogen channel + Oxygen env access survived the handover.

**Still open — do not treat any of these as done:**

- ⚠️ **David's access *type* is unconfirmed: collaborator seat or staff seat?**
  Basic includes **0** staff accounts beyond the owner, so "Administrator,
  Active" and the plan's seat limit are in apparent tension — which is exactly
  why this is unresolved. Test: Partner dashboard → Stores. If
  `gqrjsh-ha.myshopify.com` is listed, it is collaborator access (free,
  uncapped). If it is **not** listed, he is occupying a staff seat that Basic
  does not include and Shopify can be expected to flag it. Fix by removing the
  staff user and re-entering via a collaborator request (code from Settings →
  Users and permissions → Collaborators). This is the item that can silently
  cost David deploy access.
- **Permissions must include "Apps and channels"** — needed for the Hydrogen
  channel, `hydrogen env pull/push` and Oxygen. Unconfirmed.
- ⚠️ **Outbound mail still routes to David.** Store contact email (Settings →
  General) and notification sender/reply-to (Settings → Notifications) have not
  been changed. The transfer does **not** re-route mail, so order
  confirmations, customer replies and Shopify alerts keep landing in David's
  inbox until Jessie changes them. Live operational hazard, not a formality.
- **Billing** — Jessie's card on the Basic plan. Not yet done.
- **Payments** — if Shopify Payments was never activated in David's name,
  Jessie simply activates it herself. If it *was* active in his name, the
  transfer does not move it and changing its business details needs a Shopify
  **Support ticket** — the long pole, and payouts can be held during
  re-verification. Open early.
- **Tax details** — unchecked.
- ⚠️ **2FA is not enabled on either account** (both show the red crossed-shield
  in the users list). It is **mandatory for collaborator accounts**, so this is
  plausibly what is gating or limiting David's access type above. Fix this
  first.

---

## 9. Gotchas learned the hard way

1. **Dev-Dashboard development stores are a dead end for hosting**: they can't
   take a real plan, can't create Hydrogen storefronts (admin + CLI both fail
   with generic errors), can't be transferred or upgraded, and never serve
   public traffic. Build on a real store from the start.
2. **`npm install` on macOS drops Linux-only `@emnapi/*` optional deps from
   `package-lock.json`**, which breaks CI's `npm ci` ("lock file … not in
   sync"). Fix: `rm -rf node_modules package-lock.json && npm install`, verify
   with `npm ci --dry-run`, commit the regenerated lockfile. This has now
   happened twice (commits `720033b`, `a179f63`) — check after any local
   `npm install <pkg>`.
3. **CSP directives in `app/entry.server.tsx` do not all behave the same way**
   (the file's own comment block is the authority):
   - `defaultSrc`, `connectSrc`, `styleSrc`, `baseUri` and `frameAncestors` are
     **merged** with Hydrogen's defaults, so nothing listed can knock out the
     Shopify CDN, the shop domains, or the dev-only localhost/websocket entries.
   - `imgSrc` and `fontSrc` have **no Hydrogen default**, so what's listed there
     is the *whole* directive. Adding Google Fonts or a new image host means
     extending `fontSrc` / `styleSrc` / `imgSrc` up front, or the assets fail
     silently in the browser with no server-side error.
   - ⚠️ **Never declare `scriptSrc`.** Hydrogen has no default for it, so
     declaring one stops scripts falling back to `defaultSrc` and silently drops
     `cdn.shopify.com` (and localhost in dev). Script hosts go into
     `defaultSrc` instead — which is why `eu-assets.i.posthog.com` is listed
     there rather than in `scriptSrc`.
4. **PostHog SPA pageviews require `capture_pageview: 'history_change'`** (the
   string), which `defaults: '2025-05-24'` already yields; both are set
   explicitly in `app/components/PostHogAnalytics.tsx:34-40`. Passing `true`
   would disable route-change capture in posthog-js 1.418.x.
5. **Cloudflare proxy (orange cloud) on Shopify records breaks TLS
   issuance** — grey cloud always (see §7).
6. **A domain freshly imported to Cloudflare keeps its old host's records** —
   after pointing at Shopify, delete leftover wildcard/`A`/`AAAA` records from
   the previous host or the apex resolves to the wrong server.
7. **The newsletter form discards submissions**
   (`app/components/Newsletter.tsx`) — it shows a thank-you and sends the email
   nowhere. Subscribers are silently lost. Wire a real destination before
   anyone drives traffic at the site.
8. **`/account` is a stub** that admits in its own copy that accounts are
   "wired up in a follow-up step". Either build it or hide the header/footer
   links before go-live. Checkout is Shopify-hosted and unaffected.
