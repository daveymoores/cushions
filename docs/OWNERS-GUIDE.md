# Sisu — owner's guide

Everything you need to run sisuhomeware.com day to day. Written for two people:
**Jessie** (runs the shop, adds content — no code needed) and **David** (builds
and deploys the site). Set up on 19 Aug 2026.

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

**Dead / deprecated — do not use:**
- The old dev store `sisu-yswysm5o.myshopify.com` (a Dev-Dashboard development
  store; can never go live). Safe to delete once nothing references it.
- The old Cloudflare Worker deployment ("sisu") — the code that supported it
  was removed from the repo.
- The old Headless-channel API token. Production credentials are now injected
  by Oxygen automatically; local ones come from `npx shopify hydrogen env pull`.

---

## 2. Is the site public? The go-live switch

**Current state: private.**

- `https://sisuhomeware.com` points at the (unused) Online Store, which sits
  behind Shopify's default password page — visitors see nothing.
- The real site is live at
  `https://sisu-8bbdf3dc78d11fd67dae.o2.myshopify.dev` — but that URL requires
  logging in with a Shopify staff account.

**To go public (one dropdown):**
Shopify admin → **Settings → Domains → sisuhomeware.com → Domain target →
Change** → pick **Sisu (Production)** instead of "Online Store". Within minutes
sisuhomeware.com serves the real site to everyone.

To go private again, change the target back to "Online Store".

---

## 3. Adding content (Jessie)

The design lives in code; **all content lives in Shopify admin**. The site
reads it live — add or edit in admin and it appears on the site (allow a
minute or two of caching; the homepage caches briefly).

> One nuance: while the store has no content yet, the site shows built-in
> designed placeholder copy and images. Anything you add replaces the
> corresponding placeholder.

### Products
1. **Products → Add product** — title, description, price, photos, options.
2. In the product's **Publishing / Sales channels** box, make sure
   **Hydrogen** is ticked — unpublished products don't appear on the site.
3. Scroll to **Metafields** on the product and fill the "object record" shown
   on the product page: **fiber, origin, loom, care, repair** (one line each).

### Collections (these drive the site's navigation)
**Products → Collections → Create collection** (e.g. Linen, Velvet, Wool),
add products, publish to Hydrogen. The footer and mobile menu list collections
automatically. The homepage's featured strip is currently pinned to a
placeholder handle — tell David which collection should be featured and he'll
point `FEATURED_HANDLE` in `app/routes/_index.tsx` at it (until then it falls
back to the first collection it finds).

### Pages (Atelier, Shipping, …)
**Online Store → Pages → Add page.** The page's **handle** decides its URL:
- handle `atelier` → shows at `/atelier` (specially styled)
- any other handle → `/pages/<handle>` (e.g. `shipping` → `/pages/shipping`)

### Journal (blog)
**Online Store → Blog posts.** Create a blog with the handle **`journal`**,
then add posts to it. They appear at `/journal` and `/journal/<post-handle>`.

### Materials
**Content → Metaobjects → material → Add entry** — name, description, image.
Entries appear at `/materials`.

### Homepage copy & announcement bar
**Content → Metaobjects → homepage** — keep exactly **one** entry. Any field
left blank falls back to the built-in copy. Fields:

| Field | Controls |
|---|---|
| `announcement` | The scrolling announcement bar — one message per line |
| `hero_eyebrow` | Small line above the hero heading |
| `hero_heading` | The big hero heading |
| `hero_cta_label` | The hero button text |
| `hero_image` | The hero background image |
| `intro` | The introduction paragraph |
| `mending_heading` / `mending_body` | The mending/repair section |
| `material_heading` / `material_body` | The materials section |
| `commission_heading` | The commissions section heading |
| `newsletter_heading` / `newsletter_body` | The newsletter block |

---

## 4. Deploying (David)

- **Push to `main` → production deploy.** The GitHub Action
  (`.github/workflows/oxygen-deployment-1000171225.yml`) builds and publishes
  to Oxygen. Watch it in the repo's Actions tab or the Hydrogen channel.
- **Any other branch → preview deploy** with its own URL.
- Manual deploy from a terminal: `npx shopify hydrogen deploy`.
- Local dev: `npm run dev` (http://localhost:3000). Production-like run:
  `npm run preview`. Checks: `npm run typecheck`, `npm run lint`.
- **Environment variables** live in the Hydrogen channel (Storefront settings →
  Environments and variables), not the repo:
  - `npx shopify hydrogen env pull` — write them into local `.env`
  - `npx shopify hydrogen env push --env production` — push local `.env` up
    (interactive confirm; run in a real terminal)
- **Mock vs live data is automatic**: `app/lib/storefront.ts → usesMockData()`
  serves design fixtures only when `PUBLIC_STORE_DOMAIN` is unset or
  `mock.shop`. Production has the real domain injected by Oxygen, so it's on
  live store data already. To do pure design work locally, set
  `PUBLIC_STORE_DOMAIN="mock.shop"` in `.env`.

---

## 5. PostHog (analytics)

- Dashboards: [eu.posthog.com](https://eu.posthog.com) → project **SISU**.
- What's wired: automatic pageviews, including client-side route changes
  (History API capture). Lazy extensions (session replay, surveys) are
  CSP-allow-listed (`eu.i.posthog.com`, `eu-assets.i.posthog.com` in
  `app/entry.server.tsx`).
- Controlled by two env vars: `PUBLIC_POSTHOG_KEY` and `PUBLIC_POSTHOG_HOST`
  (`https://eu.i.posthog.com`). Both are set in Oxygen production and in the
  local `.env`.
- ⚠️ **An empty key silently disables analytics** — no error, just no events.
  If PostHog looks dead, check the key is set in the environment you deployed.

---

## 6. Cloudflare / DNS

Nameservers: `cullen.ns.cloudflare.com` / `mia.ns.cloudflare.com` (changed at
Hostnet; Hostnet is registrar-only now). SSL/TLS mode: **Full (strict)**.

Final records for `sisuhomeware.com`:

| Type | Name | Content | Proxy |
|---|---|---|---|
| A | `sisuhomeware.com` | `23.227.38.65` (Shopify) | **DNS only** |
| CNAME | `www` | `shops.myshopify.com` | **DNS only** |
| TXT | `sisuhomeware.com` | SPF (`v=spf1 …`) | — |
| TXT | `_dmarc` | DMARC (`v=DMARC1; p=reject`) | — |

⚠️ **The Shopify records must stay grey-cloud (DNS only).** Turning on
Cloudflare's orange-cloud proxy breaks Shopify's TLS certificates — Shopify
flags it as an error. Ignore Cloudflare's "proxying is required" banner.

**Email:** none exists on the domain yet. When wanted, Cloudflare **Email
Routing** gives free forwarding addresses (hello@sisuhomeware.com → Gmail) in
minutes and adds its own MX/SPF records automatically.

---

## 7. Accounts & access

- Shopify **Basic includes exactly one admin user** — adding a second staff
  member is blocked ("user limit reached"); the Grow plan (~€75+/mo) isn't
  worth it for a second seat.
- **The plan:** transfer store ownership to Jessie
  (`jessiebrewin.nl@gmail.com`) via Settings → Users → transfer ownership —
  she becomes the store's included user (content, orders, billing). David then
  requests **collaborator access** from the Far Harbour partner/dev
  organization — collaborators are free and don't count toward the user limit.
- Until then, the site preview (`…o2.myshopify.dev`) is only viewable while
  logged in as David.

---

## 8. Gotchas learned the hard way

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
3. **Never add a `scriptSrc` array to the CSP** in `app/entry.server.tsx`.
   Hydrogen merges overrides only for `defaultSrc`, `connectSrc`, `styleSrc`,
   `baseUri`, `frameAncestors`; a custom `scriptSrc` would *replace* the
   defaults, drop `cdn.shopify.com`, and take the whole site down. Script
   hosts go into `defaultSrc`.
4. **PostHog SPA pageviews require `capture_pageview: 'history_change'`** (the
   string), which the `defaults: '2025-05-24'` config yields. Passing `true`
   would disable route-change capture in posthog-js 1.418.x.
5. **Cloudflare proxy (orange cloud) on Shopify records breaks TLS
   issuance** — grey cloud always (see §6).
6. **A domain freshly imported to Cloudflare keeps its old host's records** —
   after pointing at Shopify, delete leftover wildcard/`A`/`AAAA` records from
   the previous host or the apex resolves to the wrong server.
