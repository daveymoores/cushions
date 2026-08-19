# Sisu storefront — handoff guide

A custom Shopify storefront built with **Hydrogen** (Shopify's React framework).
Unlike a normal Shopify theme, the look and structure live in code here, while
all the **content** (products, collections, pages, prices, checkout) lives in
your Shopify admin. You can do a huge amount from Shopify admin alone — no code.

---

## 1. Running it on your computer

You need [Node.js](https://nodejs.org) 22+ installed. Then, in a terminal in
this folder:

```sh
npm install      # first time only — installs dependencies
npm run dev      # starts the local site
```

Open the URL it prints (usually http://localhost:3000). Edits to code or to your
Shopify catalog show up on refresh.

The Shopify connection lives in a file called `.env` (already set up). It points
at the live store via the **Hydrogen** sales channel. If `.env` is ever missing,
run `npx shopify hydrogen env pull` — the repo is linked to the Sisu storefront,
and the command writes the current values (then re-add any local-only extras
from `.env.example`).

> If `PUBLIC_STORE_DOMAIN` in `.env` is set to `mock.shop`, the site runs on
> built-in fake data (handy for design work with no store). With the real
> domain, it runs on live Shopify data automatically.

---

## 2. What you can change from Shopify admin (no code)

These update the live site automatically:

| You want to… | Do this in Shopify admin |
|---|---|
| Add / edit / remove a product | **Products** → add it, set price, images, options, description |
| Group products | **Products → Collections** → create a collection, add products |
| Change what's in the nav / footer | The footer + mobile menu list your **collections** automatically |
| Edit the Atelier page text | **Online Store → Pages** → create/edit a page with the handle `atelier` |
| Change prices, run a sale | **Products** (compare-at price shows as a sale) |

**Important:** for anything to appear on this storefront, it must be **published
to the Hydrogen channel**. When editing a product or collection, check the
"Publishing" / sales-channels box and make sure **Hydrogen** is ticked.

### The homepage featured collection
The big "The Collection" strip on the homepage shows one collection. By default
it shows the first collection it finds. To pin a specific one, a developer sets
`FEATURED_HANDLE` in `app/routes/_index.tsx` to that collection's handle.

---

## 3. Editorial / "other content" — how it works

Shopify can manage all the non-product content too. Three tools, from simplest
to most powerful:

### a) Pages — for static pages (About, Atelier, Shipping…)  ✅ wired
**Best for:** one-off pages with a heading and body text.
- In admin: install the **Online Store** sales channel (free), then
  **Online Store → Pages → Add page**. The **handle** is how code finds it.
- **Any page is live at `/pages/<handle>`** automatically — e.g. a page with
  handle `shipping` shows at `/pages/shipping`. No code needed.
- The **Atelier** page (`/atelier`) is also wired specifically to a page with
  handle `atelier`, so it keeps its own styling. Create that page and your text
  replaces the placeholder.

### b) Blog & Articles — for the Journal  ✅ wired
**Best for:** dated posts with an author, image, and body (a journal/blog).
- In admin: **Online Store → Blog posts**. Create a **blog with the handle
  `journal`** and add posts to it.
- The `/journal` page lists those posts; each is live at `/journal/<post-handle>`.
  Until the blog exists, `/journal` shows the placeholder.

### c) Metaobjects — for custom, repeatable content  ✅ example wired
**Best for:** structured content that isn't a product, page, or blog post —
e.g. "Materials", "Stockists", homepage editorial blocks, lookbook entries.
- In admin: **Settings → Custom data → Metaobjects → Add definition**. You
  design the fields (text, image, rich text, references…).
- ⚠️ **Crucial:** in the definition, enable **"Storefront access"** (a.k.a.
  expose to the Storefront API) — otherwise the site can't read it.
- **Example wired:** define a metaobject of type **`material`** with fields
  `name` (single line text), `description` (multi line text), and optionally
  `image` (file → image). Add entries and they appear at **`/materials`**.
  This is the pattern a dev copies for any other custom content type.

### d) Homepage & product editorial  ✅ wired
All the homepage marketing copy and the product "object record" are editable in
Shopify (with the current copy as fallback until you fill them in):

- **Homepage / announcement bar** → a singleton metaobject of type **`homepage`**
  (one entry). Fields: `announcement` (multi-line — one marquee line each),
  `hero_eyebrow`, `hero_heading`, `hero_cta_label`, `hero_image`, `intro`,
  `mending_heading`, `mending_body`, `material_heading`, `material_body`,
  `commission_heading`, `newsletter_heading`, `newsletter_body`. (Full list in
  `app/lib/content.ts`.) Enable **Storefront access** on the definition.
- **Product object record** → product **metafields** in the `custom` namespace:
  `fiber`, `origin`, `loom`, `care`, `repair` (single line text each). Set them
  per product (Products → a product → Metafields). Enable Storefront access on
  each metafield definition.

> Note: headings authored in Shopify render as plain text — the hand-tuned
> italic accents in the design only show on the built-in fallback copy.

> **Metafields** (Settings → Custom data) are the related tool for adding extra
> fields *to products/collections* — e.g. a "Care instructions" or "Fabric"
> field on every product.

---

## 4. What to set up on the Shopify side (checklist)

1. **Install the Online Store sales channel** (free) — unlocks Pages, Blog
   posts, and Navigation menus for the Storefront API to read.
2. **Publish products & collections to the Hydrogen channel** — anything not
   published won't show on the site.
3. **Create real collections** (Linen, Velvet, Wool… whatever you sell) — these
   drive the nav automatically.
4. **Create an `atelier` Page** (and any others, e.g. `shipping`) — Atelier
   shows at `/atelier`, the rest at `/pages/<handle>`.
5. **Create a blog with handle `journal`** and add posts — they appear at
   `/journal`.
6. **Add a `material` Metaobject definition** (fields: name, description,
   image) with **Storefront access enabled**, then add entries → `/materials`.
7. **Add a `homepage` Metaobject definition** (fields listed in §3d) with
   Storefront access, then add one entry to control the homepage copy.
8. **Add `custom` product metafields** (`fiber`, `origin`, `loom`, `care`,
   `repair`) with Storefront access, and fill them per product.

---

## 5. Where things live in the code (for a developer)

| Area | File(s) |
|---|---|
| Homepage | `app/routes/_index.tsx` |
| Product page | `app/routes/products.$handle.tsx` |
| Collection pages | `app/routes/collections.$handle.tsx`, `collections._index.tsx` |
| Cart | `app/routes/cart.tsx` (+ `app/lib/context.ts`) |
| Header / Footer / nav | `app/components/Header.tsx`, `Footer.tsx` |
| Shopify queries | `app/lib/queries.ts` |
| API → UI mapping | `app/lib/adapters.ts` |
| Brand colours, fonts, type scale | `app/styles/app.css`, fonts in `app/root.tsx` |
| Mock/design data | `app/lib/mock-data.ts` |

After changing any Shopify query, run `npm run codegen` then `npm run typecheck`.

---

## 6. Deploying it live

The site is hosted on **Shopify Oxygen** — Shopify's own hosting for Hydrogen
storefronts. It's included with any paid Shopify plan (~£25–30/mo Basic), and
it's the only deployment target this repo is set up for.

### One-time setup

1. In Shopify admin, install the **Hydrogen** sales channel
   (Settings → Apps and sales channels → Shopify App Store → "Hydrogen").
2. In the Hydrogen channel, **create a storefront** for this shop.
3. Choose **Connect to GitHub** and pick this repository, with `main` as the
   production branch. Shopify adds a GitHub Action to the repo that builds and
   deploys on every push.
4. In the Hydrogen channel → **Storefront settings → Environments**, set the
   environment variables for the Production environment:
   - `SESSION_SECRET` — a long random string (signs the session cookie)
   - `PUBLIC_POSTHOG_KEY` — the PostHog project API key
   - `PUBLIC_POSTHOG_HOST` — `https://eu.i.posthog.com`

   The Shopify storefront variables (`PUBLIC_STORE_DOMAIN`,
   `PUBLIC_STOREFRONT_API_TOKEN`, `PUBLIC_STOREFRONT_ID`,
   `PUBLIC_CHECKOUT_DOMAIN`) are injected by Oxygen automatically once the
   storefront is linked — you don't set those by hand.

   ⚠️ If `PUBLIC_POSTHOG_KEY` is missing or blank, the site still works but
   **analytics silently do nothing** — that's deliberate (it keeps local dev
   clean), so it won't show up as an error. Double-check it's set.

### Day-to-day

- **Push to `main` → it deploys.** Every other branch gets its own preview URL.
- To deploy by hand from a terminal: `npx shopify hydrogen deploy`.
- `npm run preview` builds and serves the production bundle locally on the same
  runtime Oxygen uses — worth doing before a push if you've changed the server.
- To pull the Oxygen environment variables into a local `.env`:
  `npx shopify hydrogen env pull`.

### Custom domain

Point the domain at the storefront in Shopify admin (Settings → Domains) once
the Oxygen deployment is live; Shopify issues the TLS certificate. DNS for
`sisuhomeware.com` is managed at Cloudflare (DNS only — Cloudflare is *not*
hosting the site).

---

## 7. Status — done vs. to-do

**Done**
- Live Shopify product, collection, and cart data (add / update / remove / checkout)
- Dynamic, collection-driven navigation
- Full redesign (typography, emblem, hero, product page)
- Content from Shopify: Pages (`/atelier`, `/pages/<handle>`), Blog/Journal
  (`/journal`), and Metaobjects (`/materials`)
- All homepage editorial + announcement bar editable via a `homepage`
  metaobject; product object-record via `custom.*` metafields
- SEO: per-page title/description/canonical, Open Graph + Twitter, JSON-LD
  structured data (Product/Article/Breadcrumb/Organization), robots.txt, sitemap.xml

**Not done yet**
- Customer accounts (`/account` is a placeholder)
- Product variant images don't switch when you pick an option
- Cart is a full page (no slide-out drawer / optimistic UI)
- The Journal/Materials pages aren't linked from the main nav yet (reachable by
  URL); add nav links once you've created the content

**Done since (Aug 2026)** — hosting is live: the Hydrogen sales channel is
installed on the Sisu store (gqrjsh-ha.myshopify.com), the GitHub connection
deploys `main` to Oxygen, and PostHog is active with `PUBLIC_POSTHOG_KEY` set
in production. See `docs/OWNERS-GUIDE.md` and `LAUNCH.md` for current state.
