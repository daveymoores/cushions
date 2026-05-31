# Sisu

Shopify Hydrogen storefront for an heirloom cushion brand. This is the
**mock-data phase** — the design is finalised against typed fixtures so the
real store can be wired up in a single follow-up step.

## Stack

- [Shopify Hydrogen](https://hydrogen.shopify.dev) (React Router 7)
- TypeScript
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- Cormorant Garamond + Inter, loaded from Google Fonts in `app/root.tsx`

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
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
```

## Mock-data layer

All product, collection, variant, and image fixtures live in
`app/lib/mock-data.ts`. The shapes mirror a small subset of the Shopify
Storefront API (`Product`, `ProductVariant`, `Collection`, `Image`, `Money`,
…), so the React components work unchanged once the real GraphQL responses
are wired in.

### The `USE_MOCK_DATA` flag

Each route loader has a `USE_MOCK_DATA` constant at the top of the file that
defaults to `true`. Files that contain the flag:

- `app/routes/_index.tsx`
- `app/routes/products.$handle.tsx`
- `app/routes/collections.$handle.tsx`
- `app/routes/collections._index.tsx`

Each file shows the shape of the real `storefront.query(...)` call as a
commented placeholder beneath the mock branch — but the GraphQL **query
strings themselves are not yet defined**. When you swap to live data, write
the queries (or import them from `app/lib/fragments.ts`, which you'll need
to recreate) and pass them into the placeholder calls. The skeleton
template's `app/lib/fragments.ts` and route-level queries are a useful
starting point: <https://github.com/Shopify/hydrogen/tree/main/templates/skeleton>.

## Swapping in a real Shopify store

When the Shopify store is created and populated:

1. **Add a Storefront API access token** to your shop and copy the value.
2. **Create `.env`** (or update the existing one) with your real values:
   ```env
   SESSION_SECRET="<a long random string>"
   PUBLIC_STORE_DOMAIN="your-shop.myshopify.com"
   PUBLIC_STOREFRONT_API_TOKEN="<your storefront API token>"
   PUBLIC_STOREFRONT_ID="<your storefront id>"
   PUBLIC_CHECKOUT_DOMAIN="your-shop.myshopify.com"
   ```
3. **In each loader listed above**, set `USE_MOCK_DATA = false` and uncomment
   the real `storefront.query(...)` block. The accompanying GraphQL query
   strings are kept in the same file for convenience — extract them into
   `app/lib/fragments.ts` if you'd prefer to share fragments across routes.
4. **Wire up the cart**. The Hydrogen cart provider is already constructed
   inside `app/lib/context.ts` (with a minimal `CART_QUERY_FRAGMENT`).
   Replace `app/routes/cart.tsx` with a real cart route that reads
   `context.cart` and renders line items / totals / checkout link. The
   skeleton template's `CartMain` / `CartLineItem` / `CartSummary`
   components are a useful reference — they were removed for the design
   phase and can be re-pulled from
   <https://github.com/Shopify/hydrogen/tree/main/templates/skeleton>.
5. **Re-add account routes** by pulling the skeleton's `account.*` files
   back in and removing `app/routes/account.tsx`.
6. **Run `npm run codegen`** to generate typed query results in
   `storefrontapi.generated.d.ts` and replace the `mock-data.ts` types in
   route loaders with the generated ones.

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
