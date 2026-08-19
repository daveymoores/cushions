# Sisu

Shopify Hydrogen storefront for an heirloom cushion brand, connected to the
Sisu Shopify store and hosted on Oxygen. A built-in mock-data layer still
serves the full design when no real store is configured (see below).

## Stack

- [Shopify Hydrogen](https://hydrogen.shopify.dev) (React Router 7)
- TypeScript
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- Fraunces + Cinzel + Hanken Grotesk, loaded from Google Fonts in `app/root.tsx`

## Run it

`server.ts` requires a `SESSION_SECRET` and the request handler also needs
`PUBLIC_STORE_DOMAIN` to construct the storefront client (the `mock.shop`
default is fine for the design phase). Copy the example env file before
starting the server:

```bash
cp .env.example .env
npm install
npm run dev
```

The dev server starts on `http://localhost:3000` (or the next free port). The
homepage renders all ten sections; PDP, PLP, and stubs (`/journal`,
`/atelier`, `/account`, `/cart`) are functional placeholders.

Other useful scripts:

```bash
npm run build       # production build
npm run preview     # build, then serve the production bundle on mini-oxygen
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
```

## Deployment

**Shopify Oxygen is the only deployment target.** The build (`shopify hydrogen
build`) emits an Oxygen worker via the `oxygen()` Vite plugin, and
`react-router.config.ts` uses Hydrogen's preset — there is no alternate host
configured.

Deploys are driven by the **Hydrogen sales channel's GitHub integration**:
connect this repo to a Hydrogen storefront in Shopify admin with `main` as the
production branch, and Shopify installs a GitHub Action that builds and deploys
on every push (other branches get preview URLs). `npx shopify hydrogen deploy`
does the same thing manually from a terminal.

Environment variables live in the Hydrogen channel under **Storefront settings →
Environments**, not in this repo. Set `SESSION_SECRET`, `PUBLIC_POSTHOG_KEY`,
and `PUBLIC_POSTHOG_HOST` there; the `PUBLIC_STORE_DOMAIN` /
`PUBLIC_STOREFRONT_API_TOKEN` / `PUBLIC_STOREFRONT_ID` /
`PUBLIC_CHECKOUT_DOMAIN` values are injected by Oxygen automatically. Pull them
down locally with `npx shopify hydrogen env pull`.

## Analytics

PostHog (EU cloud) is initialised client-side from
`app/components/PostHogAnalytics.tsx`,
rendered by `app/root.tsx`. It reads `PUBLIC_POSTHOG_KEY` and
`PUBLIC_POSTHOG_HOST`, which the root loader forwards to the browser. **If the
key is empty or missing, PostHog never initialises** — so local dev without
keys sends no events, and a production deploy with an unset key silently
records nothing. Pageviews (including client-side route changes) are captured
automatically via the History API; no manual `capture()` calls are needed.

The PostHog hosts are allow-listed in the CSP in `app/entry.server.tsx` —
`https://eu.i.posthog.com` for the ingest endpoint and
`https://eu-assets.i.posthog.com` for the lazily loaded extension bundles
(session recorder, surveys, toolbar).

## Mock-data layer

All product, collection, variant, and image fixtures live in
`app/lib/mock-data.ts`. The shapes mirror a small subset of the Shopify
Storefront API (`Product`, `ProductVariant`, `Collection`, `Image`, `Money`,
…), so the React components work unchanged once the real GraphQL responses
are wired in.

### How mock vs. live data is chosen

There is no flag to flip: `usesMockData()` in `app/lib/storefront.ts` returns
true only when `PUBLIC_STORE_DOMAIN` is unset or `mock.shop`. Every route
loader branches on it — mock fixtures in that case, otherwise live
`storefront.query(...)` calls using the shared queries in `app/lib/queries.ts`
(mapped to UI types via `app/lib/adapters.ts`).

In production, Oxygen injects the real store domain, so the deployed site is
always on live data. Locally, `npx shopify hydrogen env pull` writes the real
credentials into `.env`; set `PUBLIC_STORE_DOMAIN="mock.shop"` instead when
you want to work on the design without a store.

## Design reference

Brand language, palette, type, and section list are documented in the
original brief. A few load-bearing files:

- `app/styles/app.css` — Tailwind v4 `@theme` tokens (cream / bone / ink /
  stone / rust / hairline) and component classes (`.eyebrow`,
  `.underline-link`, `.btn-bleed`, `.marquee`, `.product-card-image`).
- `app/components/PageLayout.tsx` — `AnnouncementBar` + `Header` + `Footer`
  shell.
- `app/routes/_index.tsx` — homepage, in section order.

## A note on placeholder images

`app/lib/mock-data.ts` lists `images.unsplash.com` URLs in a single
`placeholderImages` map at the top of the file, with
`?w=1200&auto=format&fit=crop` parameters. They render through native
`<img loading="lazy">`, not Hydrogen's `<Image>` (which expects Shopify CDN
URLs). Replace the entire map with Shopify CDN URLs when you wire up real
data, or swap individual photos here during the design phase. If any URL
404s in the browser, pick a fresh photo ID from
[unsplash.com](https://unsplash.com) and update the map.
