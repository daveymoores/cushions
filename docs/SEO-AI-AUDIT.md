# Sisu (sisuhomeware.com) — SEO / AI-discoverability audit — 2026-08-19

Read-only. No repo files modified.

Headline: the SEO layer is a competent single-commit scaffold (`edb43c1`, the only commit ever to
touch `app/lib/seo.ts`, `[robots.txt].tsx`, `[sitemap.xml].tsx`) that has never been revisited. It gets
the plumbing right — every route has a `meta` export, `getSeoMeta` merges root + route, canonicals and
JSON-LD render. What it lacks is (a) a fixed canonical host, (b) any of the 2026 agent-discovery surface,
and (c) the structured-data fields that actually gate merchant listings and entity resolution.

---

## Live evidence (curl, 2026-08-19 11:03 UTC)

| Check | Result |
|---|---|
| `https://sisuhomeware.com/` | **301 → `https://gqrjsh-ha.myshopify.com/`**, `x-redirect-reason: primary_domain_redirection` |
| `https://www.sisuhomeware.com/` | same 301 → myshopify.com |
| `https://gqrjsh-ha.myshopify.com/` | 302 → `/password` |
| `https://gqrjsh-ha.myshopify.com/password` | **200**, `x-robots-tag: nofollow` **only** — no `noindex`; 0 occurrences of `noindex` in the 84 KB body; `<link rel=canonical href=".../password">`; `<title>&ndash; Sisu</title>`; `og:site_name: Sisu` |
| `https://sisu-8bbdf3dc78d11fd67dae.o2.myshopify.dev/` | 302 → accounts.shopify.com OAuth (staff-gated), `powered-by: Shopify, Oxygen` |
| `gqrjsh-ha.myshopify.com/robots.txt` | 200, Shopify's own — opens with an agentic-commerce preamble advertising `/agents.md`, `/.well-known/ucp`, `/api/ucp/mcp`, `shop.app/SKILL.md`, `Contact: bots@shopify.com`. Two groups only (`*`, `adsbot-google`). **No named AI-bot groups. No `Sitemap:` line.** |
| `/agents.md`, `/.well-known/ucp` | 302 (password gate) — generated, but unreadable while private |

## Storefront API field availability verified
`node_modules/@shopify/hydrogen/dist/storefront-api-types.d.ts`

- `Product` (:6946) HAS `updatedAt`, `publishedAt`, `seo`, `availableForSale`, `totalInventory`, `category`, `descriptionHtml`, `compareAtPriceRange` — **none selected**
- `ProductVariant` (:7588) HAS `sku`, `barcode`, `quantityAvailable`, `weight`, `weightUnit` — **none selected**
- `Page` (:6716) HAS `updatedAt`, `createdAt` — not selected
- `Article` (:121) **has NO `updatedAt`** — only `publishedAt`
- `Shop` (:9137) HAS `brand{logo,squareLogo,shortDescription,slogan}`, `primaryDomain{url,host}`, `description`, `refundPolicy`, `shippingPolicy`, `privacyPolicy`, `termsOfService`, `contactInformation` — **never queried anywhere**

## `getSeoMeta` behaviour — verified empirically by running the installed package

Emits: title / og:title / twitter:title, description / og:description / twitter:description,
`<link rel=canonical>`, og:url, `og:image:url|secure_url|type|width|height|alt`, one `script:ld+json`
per entry, hreflang alternates, `meta robots`.

**Never emits:** bare `og:image` (only for *string* media), `twitter:card`, `twitter:image`,
`og:type`, `og:site_name`, `og:locale`.

`getSitemap`/`getSitemapIndex` exported (index.js:1018), unused here.
`createRequestHandler` auto-proxies `/api/mcp` (regex `/^\/api\/mcp$/`) to Shopify's Storefront MCP —
so `server.ts:25-31` already gives the app an MCP endpoint for free. Nothing advertises it.

---

# P0 — before the domain cutover

## P0-1. The whole SEO layer derives its origin from the inbound request

`app/lib/seo.ts:38-45`
```ts
export function canonical(request: Request): string {
  const url = new URL(request.url);
  return url.origin + url.pathname;
}
export function origin(request: Request): string {
  return new URL(request.url).origin;
}
```
Consumed by `rootSeo` (:49), `productSeo` (:97-98), `collectionSeo` (:137-138), `articleSeo` (:174),
`pageSeo` (:202), `basicSeo` (:226), plus `[sitemap.xml].tsx:14` and `[robots.txt].tsx:4`.

Every host that reaches the app therefore self-canonicalises, publishes a sitemap of its own URLs, and
serves a robots.txt pointing at its own sitemap — i.e. any second host is a complete duplicate site
that never points back at the brand domain.

The Oxygen URL is OAuth-gated today (verified: 302 to accounts.shopify.com), so this is not yet live.
Whether it stays gated after the domain is attached is the thing to check — re-run
`curl -I https://sisu-8bbdf3dc78d11fd67dae.o2.myshopify.dev/` after cutover. If it starts returning
200, it is a full duplicate of the storefront unless the canonical origin is pinned.

**Fix.** Derive the origin from one authority, not the request. Two options; the second is better because
it tracks Shopify admin automatically:

```ts
// option A: env var. Add to env.d.ts:16-19 → PUBLIC_SITE_URL?: string
export function siteOrigin(request: Request, env: Env): string {
  return env.PUBLIC_SITE_URL?.replace(/\/$/, '') ?? new URL(request.url).origin;
}

// option B: ask Shopify. Shop.primaryDomain.url is verified available.
//   query SiteOrigin { shop { primaryDomain { url } } }
// resolve once in the root loader, put it on rootSeo, thread through routeMeta.
```
Then add a host guard in `server.ts` that 301s any non-canonical host to the canonical origin.

**Post-cutover gate (do not skip).** Today `sisuhomeware.com` 301s to `gqrjsh-ha.myshopify.com`
(`x-redirect-reason: primary_domain_redirection`) — i.e. Shopify's *primary domain* is still the
myshopify one. LAUNCH.md:54's go-live step changes the domain **Target**, which is a different setting.
After flipping Target, re-run:
```
curl -I https://sisuhomeware.com/      # must be 200
curl -I https://www.sisuhomeware.com/  # must be 301 → https://sisuhomeware.com/
```
If either still 301s to `*.myshopify.com`, the primary-domain setting also needs changing.

## P0-2. Cutover *removes* the agent-discovery surface the domain has today

This is a regression, not a gap — the single most consequential AI-attribution item in the audit.

Shopify's live robots.txt on the store domain advertises `/agents.md`, `/.well-known/ucp`,
`/api/ucp/mcp` and `shop.app/SKILL.md`. Those are Online Store (theme) routes — Shopify generates them,
and `agents-md.liquid` is a theme template. **Oxygen does not inherit them.** `app/routes/` contains
neither `agents.md`, `llms.txt`, `llms-full.txt` nor `.well-known/ucp`.

And `app/routes/[robots.txt].tsx` will *replace* Shopify's robots.txt wholesale on the brand domain —
21 lines in place of Shopify's generated file, agentic preamble included.

Net: the day after cutover the brand domain is strictly worse on agent discovery than it is today.

**Rank these honestly — they are not equally valuable:**

1. **A working UCP/MCP endpoint — this is the one that matters, and it is mostly an admin setting, not
   code.** This is functional infrastructure: it's how Shopify's agentic-commerce stack lets an
   assistant read the catalogue and build a cart. **Do not try to self-host `/.well-known/ucp`** —
   Shopify staff have confirmed custom domains cannot self-host the UCP manifest; Shopify serves it,
   and it's gated behind an **"Agentic storefronts" toggle in admin**. So the action is: enable that
   toggle, then verify the manifest and MCP endpoint resolve on the brand domain after cutover.
2. **`/agents.md` — worth having, and it IS on you.** Shopify has made it the canonical agent-discovery
   file and points at it from robots.txt, but it's generated from a Liquid theme template
   (`agents-md.liquid`) — Online Store only. Shopify's own developer forum thread acknowledges the
   headless gap as unresolved. Cheap to serve from a route; nothing else will serve it.
3. **`/llms.txt` — cheap insurance, not a needle-mover. Do not oversell it.** As of 2026 no major
   vendor has committed to reading it for search or citation; Google's Gary Illyes said Google doesn't
   support it and isn't planning to, and John Mueller likened it to the keywords meta tag. Traffic
   analyses show a negligible share of AI-bot requests touch it. The genuine exception is agentic
   tooling (Anthropic's "writing for agents" guidance, OpenAI's Agents SDK / Agentic Commerce Protocol,
   and Lighthouse 13.3's agentic-browsing audit). Add it because it's ~20 lines and Shopify already
   served one — not because it will win citations.
   *(Confidence: the vendor-statement and traffic-analysis points are from secondary SEO sources, not
   primary vendor docs. Treat as well-corroborated but not verified first-hand.)*

**Fix.** Add `app/routes/[agents.md].tsx` and `app/routes/[llms.txt].tsx` (optionally
`[llms-full.txt].tsx`), and put a pointer header in robots.txt. Sketch:

```tsx
// app/routes/[agents.md].tsx
export async function loader({request, context}: Route.LoaderArgs) {
  const site = siteOrigin(request, context.env);
  const body = `# Sisu — heirloom cushions, sewn to order in north London

Sisu makes made-to-order cushions in linen, cotton velvet and undyed wool.
Every piece is cut and sewn by hand in a north London atelier and repaired for life.

## Attribution
Cite as: Sisu (${site}).

## Key pages
- [Collections](${site}/collections): all cushion collections, by material
- [Materials](${site}/materials): the cloths we work and why
- [The Atelier](${site}/atelier): how and where the work is done; commissions
- [Journal](${site}/journal): notes on materials, mending and making

## Commerce
- Product catalogue and cart: MCP endpoint at ${site}/api/mcp
- Checkout requires explicit human approval. Do not complete payment automatically.
`;
  return new Response(body, {
    headers: {'content-type': 'text/markdown; charset=utf-8', 'cache-control': 'max-age=3600'},
  });
}
```

**Verify the MCP path before advertising it.** Installed Hydrogen is 2026.4.2; latest stable is
2026.4.5 (2026-08-14). The bundle special-cases only `/^\/api\/mcp$/`; Shopify's own robots.txt
advertises `/api/ucp/mcp`; secondary reporting says the legacy path retired ~15 June 2026. Can't test
while auth-gated. So: (a) upgrade to 2026.4.5 regardless, (b) post-cutover `curl -X POST` both paths on
the live domain, (c) advertise whichever answers.

## P0-3. The mock-data fallback is silent, and would publish fake products with fake prices

`app/lib/storefront.ts:8-10`
```ts
export function usesMockData(env: Env): boolean {
  return !env.PUBLIC_STORE_DOMAIN || env.PUBLIC_STORE_DOMAIN === 'mock.shop';
}
```
It is off today (`.env` has the real store domain), so this is not "flip a switch" — it's that an unset
or mistyped Oxygen env var silently degrades the live site with no visible failure.

What ships in that state: `products.$handle.tsx:23-26` serves mock products through `productSeo()` →
full `Product` JSON-LD with invented GBP `offers.price` and an `image` array pointing at
`images.unsplash.com` (`mock-data.ts:85`). Those URLs are linked from the homepage and collection
pages, so crawlers reach them even though `[sitemap.xml].tsx:17` correctly omits them.

**Fix.** Make the fallback fail loud in the one place that matters:
```ts
// seo.ts — rootSeo(request, env)
...(usesMockData(env) ? {robots: {noIndex: true, noFollow: true}} : {}),
```
**Verified empirically** against the installed package: a root-level `robots` config propagates to
every route that doesn't override it (`getSeoMeta(rootWithNoIndex, productSeo)` →
`{name:'robots', content:'noindex,nofollow'}`). One line covers the whole site.

(LAUNCH.md:11 referred to a non-existent `USE_MOCK_DATA` variable when I started this audit; it was
corrected in the working tree by a concurrent edit partway through — see the note at the end.)

## P0-4. The password page is indexable and the brand domain funnels crawlers into it

`/password` returns **200** with `x-robots-tag: nofollow` only — no `noindex` header, and zero
occurrences of `noindex` in the 84 KB document. It self-canonicalises to
`https://gqrjsh-ha.myshopify.com/password`, titles itself `– Sisu`, and sets `og:site_name: Sisu`.
`https://sisuhomeware.com/` 301s straight into it.

So the first thing an answer engine can learn about "Sisu" is a myshopify.com password gate.

Code can't fix this — sequencing can, and the two Search Console steps in LAUNCH.md should be split
rather than both deferred:
- **Do now (LAUNCH.md:43):** add the GSC domain property and verify via DNS TXT. Verification is
  harmless while the site is private and DNS propagation takes time — no reason to wait.
- **Defer until after cutover (LAUNCH.md:44):** submitting the sitemap. Also avoid inbound links until
  then. Immediately after cutover, submit the sitemap and use GSC Removals if the `/password` URL has
  surfaced.

## P0-5. Google Merchant Center free listings are absent from the launch plan entirely

Not a code finding — the highest-leverage action available for the owner's stated goal, and it appears
nowhere in `LAUNCH.md`.

Google's Jan 2026 agentic-commerce announcements confirm AI Mode, Gemini and the new Business Agent
ground shopping answers in **Merchant Center** data. Free listings cost nothing, need no ads, and are
open to UK merchants today — and unlike OpenAI's product feed (approved partners only, Instant Checkout
US-only) or Microsoft Copilot Checkout (excludes the UK), it is the one agentic-shopping program this
brand can actually join right now.

For handmade goods set `identifier_exists: false` and leave gtin/mpn blank (see P1-5).

**Action:** add a Merchant Center section to LAUNCH.md beside the existing Google Search Console block
(LAUNCH.md:41-44), and set it up once the domain cutover is done. If the site is to *lead* on AI
discoverability, this is the single biggest missing piece — bigger than any JSON-LD change in this
report.

---

# P1 — high value, soon after launch

**Do these in order where they're coupled:** P1-7 (the missing shipping / returns / contact pages)
gates both P1-4 (`Organization.hasMerchantReturnPolicy` / `hasShippingService`) and P1-5
(`Offer.shippingDetails` / `hasMerchantReturnPolicy`) — and the same policies feed the Merchant Center
setup in P0-5. Write the policy pages first and three findings collapse into one pass.

## P1-1. robots.txt — and the trap to avoid

`app/routes/[robots.txt].tsx:5-13` currently emits:
```
User-agent: *
Allow: /
Disallow: /cart
Disallow: /account

Sitemap: {origin}/sitemap.xml
```

**The good news: nothing needs adding to allow AI crawlers.** A permissive `User-agent: *` already
permits GPTBot, OAI-SearchBot, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot, Googlebot,
CCBot and the rest. Named `Allow:` groups here would be semantically inert.

**And they'd be actively harmful.** RFC 9309: a crawler uses the group matching its own token and
*ignores* the `*` group entirely — it does not merge them. Adding `User-agent: GPTBot` / `Allow: /`
would un-protect `/cart` and `/account` for GPTBot specifically. Any named group must repeat every
disallow.

So the recommendation is narrow:
- Keep `*` permissive. Add named groups only for documentation, and if so, repeat the disallows.
- Make the `Sitemap:` line use the canonical origin (P0-1), not the request origin.
- Do **not** port Shopify's ~40 disallows wholesale. They target Online Store URLs this route table
  doesn't have — no `/checkout`, no `/services`, no `/sf_*`, no `/collections/*sort_by*` facets.
- One thing worth checking: React Router 7 single-fetch (`ssr: true` via `hydrogenPreset`) exposes
  `.data` endpoints. Post-cutover, `curl https://sisuhomeware.com/products/<handle>.data` — if it
  returns a payload, add `Disallow: /*.data`.
- Add the agent-discovery pointer header from P0-2.

Also worth knowing (all settled, nothing to do):
- **Blocking training bots does not cost citations.** Each vendor separates the tokens: OpenAI
  `GPTBot` (training) vs `OAI-SearchBot` (ChatGPT search inclusion) vs `ChatGPT-User` (live);
  Anthropic `ClaudeBot` (training) vs `Claude-SearchBot` + `Claude-User` (retrieval); Perplexity
  states `PerplexityBot` is *not* used for model training. So the site is already correctly configured
  for the owner's goal.
- **`Google-Extended` does not gate AI Overviews or AI Mode** — Googlebot does. Google-Extended governs
  Gemini training and Gemini grounding only, and is explicitly not a Search ranking or inclusion signal.
- **`ClaudeBot-User` is not a real token.** Anthropic documents exactly three: `ClaudeBot`,
  `Claude-User`, `Claude-SearchBot`. `anthropic-ai` and `Claude-Web` are legacy and absent from
  current docs.
- **`CCBot` has no citation upside either way** — Common Crawl operates no answer product.
- **Cloudflare's AI-crawler blocking cannot apply here.** AI Crawl Control requires proxied traffic;
  LAUNCH.md:38 records all records as DNS-only (grey cloud), so traffic never transits Cloudflare's
  edge. Nothing to change. (Note for later: if the zone is ever orange-clouded, don't blanket-block
  the "Training" category — multi-purpose crawlers including Googlebot get caught by it.)

Sources: [RFC 9309](https://www.rfc-editor.org/rfc/rfc9309.html) ·
[OpenAI bots](https://developers.openai.com/api/docs/bots) ·
[Anthropic crawler docs](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler) ·
[Perplexity bots](https://docs.perplexity.ai/guides/bots) ·
[Google AI features](https://developers.google.com/search/docs/appearance/ai-features) ·
[Google crawlers](https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers) ·
[Cloudflare AI Crawl Control](https://developers.cloudflare.com/ai-crawl-control/get-started/)

## P1-2. Sitemap: no lastmod, missing the journal and Shopify pages, hard cap at 250

`app/routes/[sitemap.xml].tsx`
- `:5-11` `STATIC_PATHS` covers `/`, `/collections`, `/journal`, `/materials`, `/atelier`
- `:22-25` adds products + collections only. **`journal.$handle` and `pages.$handle` routes exist
  (`app/routes/journal.$handle.tsx`, `app/routes/pages.$handle.tsx`) and are never listed** — the
  journal is the brand's whole editorial surface and none of it is in the sitemap
- `:31` `<url><loc>…</loc></url>` — no `<lastmod>` at all
- `:20` `first: 250`, no pagination

**Best fix — Hydrogen's own primitive.** `getSitemap`/`getSitemapIndex` are exported (index.js:1018)
and read `sitemap.resources.items[].updatedAt` from the Storefront API, covering products, collections,
pages, articles *and* metaobjects with real lastmod and pagination.

**But it is a restructure, not a drop-in:** `getSitemap` reads `params.type` and `params.page` and
throws without them. It needs `app/routes/sitemap.$type.$page[.xml].tsx` plus an index route at
`[sitemap.xml].tsx` using `getSitemapIndex`.

Interim minimal fix if that's too much right now: add the blog query to `SITEMAP_QUERY`, and emit
`<lastmod>` from `Product.updatedAt` / `Page.updatedAt` (both verified available, neither selected).

## P1-3. og:image never renders as `og:image`; no twitter card

Verified by running `getSeoMeta` against the installed package. Object `media` produces only
`og:image:url`, `og:image:secure_url`, `og:image:type`, `og:image:width`, `og:image:height`,
`og:image:alt` — never a bare `og:image` (that path exists only for *string* media).

To be precise about severity: [ogp.me](https://ogp.me/) states `og:image:url` is "Identical to
`og:image`", so this is spec-valid and Facebook parses it. The problem is real-world coverage —
Twitter/X, Slack, LinkedIn, Discord and WhatsApp are documented against `og:image`, and support for
the `:url` alias varies. Emitting the bare tag as well is strictly safer and costs nothing.

If you add it, **order matters**: the spec says "put structured properties after you declare their
root tag… whenever another root element is parsed, that structured property is considered to be done."
React Router renders descriptors in array order, so a bare `og:image` must be spliced in **before**
the `og:image:*` block, or it starts a second, property-less image object.

Also never emitted: `twitter:card`, `twitter:image`, `og:type`, `og:site_name`, `og:locale`.

And `rootSeo` (`seo.ts:48-71`) sets no `media` at all, so the homepage and every `basicSeo` page
(`collections._index.tsx:16`, `journal.tsx:19`, `materials.tsx:20`, `atelier.tsx:21`) ship **zero** OG
imagery. Sharing sisuhomeware.com anywhere today produces a blank card.

**One choke point.** `routeMeta` (`seo.ts:17-23`) already wraps `getSeoMeta` for every route:

```ts
const DEFAULT_OG_IMAGE = '/og-default.jpg';  // add a real 1200x630 asset — app/assets/ has 1 file

export function routeMeta(
  matches: Array<{data?: unknown} | undefined>,
  routeSeo?: SeoConfig,
  siteUrl?: string,
) {
  const root = (matches?.[0]?.data as {seo?: SeoConfig} | undefined)?.seo;
  const tags = getSeoMeta(root ?? {}, routeSeo ?? {}) ?? [];

  const isImgProp = (t: any) =>
    typeof t?.property === 'string' && t.property.startsWith('og:image');
  const firstImgIdx = tags.findIndex(isImgProp);
  const imgUrl =
    (tags.find((t: any) => t?.property === 'og:image:url') as any)?.content ??
    (siteUrl ? siteUrl + DEFAULT_OG_IMAGE : undefined);

  const extras: any[] = [
    {property: 'og:type', content: 'website'},
    {property: 'og:site_name', content: SITE_NAME},
    {property: 'og:locale', content: 'en_GB'},
    {name: 'twitter:card', content: 'summary_large_image'},
  ];
  if (imgUrl) extras.push({name: 'twitter:image', content: imgUrl});

  // bare og:image MUST precede the og:image:* structured properties
  if (imgUrl) {
    const at = firstImgIdx >= 0 ? firstImgIdx : tags.length;
    tags.splice(at, 0, {property: 'og:image', content: imgUrl} as any);
  }
  return [...tags, ...extras];
}
```
(`og:type` should be `product` on `products.$handle` and `article` on `journal.$handle` — pass an
override argument, since both routes already call `routeMeta` directly.)

## P1-4. Organization JSON-LD is four fields — nothing to resolve the entity on

`seo.ts:56-62`:
```ts
{'@context': 'https://schema.org', '@type': 'Organization',
 name: SITE_NAME, url: site, description: SITE_DESCRIPTION}
```
No `@id`, `logo`, `image`, `sameAs`, `address`, `contactPoint`, `email`, `foundingDate`, `areaServed`,
`brand`, `knowsAbout`. A stable `@id` plus `sameAs` pointing at the brand's own off-site profiles
(Instagram, Pinterest, Etsy, Wikidata if it ever exists) is the cheapest entity-disambiguation signal
available, and it's the thing that lets an assistant know two mentions of "Sisu" are the same maker.

All sourceable from Shopify and currently unqueried: `Shop.brand.logo`, `Shop.brand.squareLogo`,
`Shop.description`, `Shop.primaryDomain.url`, `Shop.contactInformation`.

**Use `@type: 'OnlineStore'`** (a subtype of Organization, and the type in Google's own example)
rather than bare `Organization`.

**Google expanded Organization markup in 2024-25 and the new fields are cheap wins for a UK Ltd:**
`hasMerchantReturnPolicy` and `hasShippingService` are now supported *at Organization level* — no
Merchant Center account required — plus `vatID`, `legalName`, `iso6523Code`, `foundingDate`,
`contactPoint`, `email`. These surface in knowledge panels and brand profiles. This is the single
highest-value structured-data change available here, and it pairs directly with P1-7 (the missing
shipping/returns pages).

Also worth declaring on `WebSite` (`seo.ts:63-68`): `inLanguage: 'en-GB'`, `publisher: {'@id': ...}`.

## P1-5. Product JSON-LD is missing the merchant-listing fields — and the query doesn't fetch them

`seo.ts:106-123`. Missing at Product level: `@id`, `url`, `sku`, `gtin`, `mpn`, `itemCondition`,
`material`, `color`, `aggregateRating`/`review`.
Missing on Offer: `priceValidUntil`, `hasMerchantReturnPolicy`, `shippingDetails`, `seller`,
`itemCondition`.

And the offer is a single Offer built from `priceRange.minVariantPrice` (`seo.ts:116-117`) — for a
multi-variant product that under-declares the range. Should be `AggregateOffer`
(`lowPrice`/`highPrice`/`offerCount`) or one Offer per variant. `availability` (`seo.ts:118-120`) uses
"any variant available", which is only correct for a single collapsed offer.

**Blocker to state up front:** `PRODUCT_FRAGMENT` (`queries.ts:73-92`) selects no `sku` and no
`barcode` on variants. Both exist on `ProductVariant` (types :7588). This is a query change *plus* a
JSON-LD change, not JSON-LD alone.

**On GTINs:** required-field anxiety is misplaced. For merchant listings Google requires only `name`,
`image`, and `offers` with `price` + `priceCurrency`; everything else above is *recommended*. GTIN is
never required, and Google's own product-data spec explicitly covers handmade goods — set
`identifier_exists: false` in any Merchant Center feed, leave gtin/mpn blank, and **never invent one**.
`sku` alone is fine.

## P1-6. `/atelier` and `/pages/atelier` are the same content at two self-canonicalising URLs

`atelier.tsx:30-33` queries `PAGE_QUERY` with handle `atelier`. `pages.$handle.tsx:23-27` renders any
page handle. If an `atelier` Page exists in admin — which `atelier.tsx` depends on — both routes return
200 and `pageSeo()` (`seo.ts:202`) gives each a self-canonical to itself.

**Fix.** In `pages.$handle`, 301 reserved handles to their bespoke route:
```ts
const RESERVED: Record<string, string> = {atelier: '/atelier'};
if (RESERVED[handle]) throw redirect(RESERVED[handle], 301);
```

## P1-7. Footer links point at pages that don't exist — and it's the same finding as the schema gap

- `Footer.tsx:24` → `/pages/shipping`, which 404s (`pages.$handle.tsx:26`) unless a `shipping` Page exists
- `Footer.tsx:32-33` point **Contact** and **Press** at `/journal`
- `Footer.tsx:21,23` point "How we make" and "Repair & return" at `/journal`

There is no contact page, no shipping page, no returns page, no privacy or terms page anywhere in
`app/routes/`. Those missing pages are exactly what `hasMerchantReturnPolicy` and `shippingDetails`
need (P1-5), and they are among the most-cited pages when an assistant is asked whether a small brand
is legitimate. Content gap and schema gap are one problem.

Shopify already stores all of it, unqueried: `Shop.refundPolicy`, `Shop.shippingPolicy`,
`Shop.privacyPolicy`, `Shop.termsOfService`, `Shop.contactInformation` (types :9137).

## P1-8. BlogPosting is thin, and `dateModified` is not sourceable from the current query

`seo.ts:183-194` — missing `dateModified`, `description`, `publisher.logo`, `author.url`, `@id`,
`isPartOf`, `inLanguage`, `articleSection`. `mainEntityOfPage` is a bare string (`:193`); the fuller
form is `{'@type':'WebPage','@id':url}`.

**Verified constraint:** Storefront `Article` (types :121) has **no** `updatedAt` — only `publishedAt`.
So `dateModified` must mirror `publishedAt`, come from a metafield, or come from the sitemap resource.
Don't promise a field the API can't give.

`Page` *does* have `updatedAt` (types :6716) but `PAGE_QUERY` (`queries.ts:213-225`) doesn't select it
— a free `dateModified` for `pageSeo`.

## P1-9. Images have no dimensions, no srcset, no CDN resizing

Alt text is genuinely good — `altText ?? title` at every call site
(`ProductCard.tsx:14`, `CollectionCard.tsx:13`, `products.$handle.tsx:95`, `journal.tsx:72`,
`journal.$handle.tsx:55`, `materials.tsx:66`, `cart.tsx:141`) and `alt=""` on decorative thumbnails
(`products.$handle.tsx:119`). No action needed there.

But every `<img>` ships raw: no `width`/`height` attributes anywhere, no `srcset`, no `sizes`, no
Shopify CDN `?width=` resize params, and no `fetchpriority="high"` on the LCP hero (`Hero.tsx:33-38`).
That's layout shift plus full-size images on mobile — a Core Web Vitals cost on the two most important
templates. Note that Hydrogen 2026 no longer exports an `Image` component, so this is hand-rolled:
add `width`/`height` from the Storefront image data (already fetched — `IMAGE_FRAGMENT`, `queries.ts:16-24`)
and build `srcset` from Shopify CDN width params.

---

# AI attribution in 2026: what moves the needle vs what doesn't

This is the part of the brief most vulnerable to folklore, so it's worth stating plainly — including
where it contradicts recommendations elsewhere in this report.

**The framing document.** Google published an official "Guide to optimizing for AI features"
(updated 2026-07-10) that mythbusts most GEO advice: Search *ignores* llms.txt ("neither harm nor
help"); structured data "isn't required for generative AI search, and there's no special schema.org
markup you need to add" (keep it for rich results); no content chunking or AI-specific rewriting is
needed; inauthentic mention-building doesn't work. Its positive list is ordinary: crawlable indexable
content, semantic HTML, JS-SEO hygiene, Merchant Center, and the new Search Console **Generative AI
performance report** (launched 2026-06-03, UK rollout began June 2026 — worth enabling as the
measurement channel).

**Ranked by evidence strength:**

1. **Google Merchant Center free listings — highest-value lever available to this brand, and it is
   zero code.** Google's Jan 2026 agentic-commerce announcements confirm AI Mode / Gemini / Business
   Agent ground shopping answers in Merchant Center data. Free, open to UK merchants, no ads needed.
   Set `identifier_exists=false` for handmade items. *This is not in the repo and not in LAUNCH.md —
   it's the biggest gap in the whole launch plan for the owner's stated goal.*
2. **Off-site brand mentions** — Ahrefs, 75,000 brands: branded web mentions correlate **0.664** with
   AI-Overview visibility vs **0.218** for backlinks (~3×). Gift guides, "best handmade cushions UK"
   listicles, genuine press. Correlational, and the author says so.
3. **Third-party / review platforms** — Reddit is the most-cited domain across AI engines (Semrush,
   126M prompts). Trustpilot/Seer (800k AI responses, 1,926 brands): no review profile → 1% citation
   rate; active profile → 53.5%. Vendor-funded and confounded, but directionally strong. Note
   astroturfing is actively detected and punished.
4. **Ordinary organic ranking** — AI Overview citations overlap heavily with the organic top 10;
   Google says AI features run on core ranking systems. Classic SEO is still the substrate.
5. **Server-rendered HTML** — a gating factor, and **this site already passes**. Vercel/MERJ (500M+
   GPTBot fetches) and 2025-26 replications agree: GPTBot, ClaudeBot and PerplexityBot **do not execute
   JavaScript at all**. Hydrogen SSRs everything including the JSON-LD, so Sisu is on the right side of
   this. Don't move content to client-only rendering.
6. **Structured data — do it, but for the right reason.** Ahrefs' matched difference-in-differences
   study (n=1,885 pages adding JSON-LD vs 4,000 controls) found **no causal lift** in AI citations:
   AI Overviews −4.6%, AI Mode +2.4% (n.s.), ChatGPT +2.2% (n.s.). Schema's prevalence among cited
   pages reflects technical sophistication, not causation. Microsoft has said Bing/Copilot use schema —
   the one vendor endorsement. **So: implement P1-4 and P1-5 for Google merchant listings and Bing, not
   because it "feeds the LLMs."**
7. **Low / no evidence** — llms.txt (see P0-2), Wikidata for a small brand, `speakable`, RSS for AI,
   FAQPage/HowTo markup, freshness signals for evergreen ecommerce.

**Two concrete technical constraints worth building around:**

- **Googlebot reads only the first 2 MB of a URL** (Gary Illyes, 2026-03-31); beyond that is "not
  rendered, not indexed." Keep title, canonical and **JSON-LD high in the document**. Worth checking
  the rendered `<head>` order once live, since `Meta`/`Links` sit at `root.tsx:105-106` before the app
  shell — currently fine, but Tailwind-heavy pages grow.
- **GPTBot and ClaudeBot began fetching `sitemap.xml` in March 2026.** That makes P1-2 (a complete,
  accurate sitemap with real `lastmod`) matter for AI crawlers too, not just Google. Google confirms it
  uses `lastmod` "if consistently and verifiably accurate" and **ignores `changefreq` and `priority`** —
  so don't add those two.

**Also worth knowing about the crawl bargain:** Cloudflare Radar's trailing-28-day crawl-to-referral
ratios (to 2026-08-01) are Anthropic 1,782:1, Perplexity 303:1, OpenAI 233:1, Google 4.8:1. Allowing AI
crawlers is a citation and brand-presence bet, not a traffic bet. Worth the owner knowing before they
measure success in referral sessions.

**Programs to check but probably not yet available:** OpenAI's product feed spec exists but onboarding
is approved-partners-only and Instant Checkout is US-only; Microsoft Copilot Checkout excludes the UK.
Google Merchant Center is the one fully open to a small UK merchant today.

---

# P2 — worth doing, lower leverage

- **`html lang="en"`** (`root.tsx:100`) — brand is UK, currency GBP (`mock-data.ts` money default),
  dates formatted `en-GB` (`journal.$handle.tsx:41`). Use `en-GB`.
- **Unsplash preconnect ships to production** (`root.tsx:47`) and is whitelisted in CSP
  (`entry.server.tsx:38,47`) — a mock-data artifact. Remove with the mock layer.
- **Favicon is one SVG** (`app/assets/favicon.svg`, wired at `root.tsx:13,48`) served from a hashed
  build path. No `/favicon.ico`, no `apple-touch-icon`, no web manifest, no `theme-color`. There is
  also no OG image asset in the repo at all — `app/assets/` contains exactly one file.
- **CollectionPage JSON-LD** (`seo.ts:146-153`) has no `image`, no `mainEntity` / `ItemList` of the
  products it lists, no `numberOfItems`. An `ItemList` is what lets an assistant enumerate the
  collection rather than guess at it.
- **WebPage JSON-LD** (`seo.ts:210-215`) is `name` + `url` only.
- **Breadcrumb label drift** — product trail calls `/collections` "Shop" (`seo.ts:126`), collection
  trail calls it "Collections" (`seo.ts:156`), header says "Shop" (`Header.tsx:9`). Pick one.
  Breadcrumb `item` is a bare URL string (`seo.ts:91`); the fuller form is
  `{'@type':'WebPage','@id':url}`, and the last item's `item` may be omitted.
- **FAQPage / HowTo markup — do NOT add.** I was going to recommend this; the research says don't.
  Google removed FAQ rich results entirely (docs deleted 2026-06-15) and deprecated HowTo in Sept 2023,
  and there's no measured evidence the *markup* helps AI engines. What does plausibly help is the
  *content shape*: the product "Object record" (`products.$handle.tsx:68-77`) already lays out
  Fiber / Origin / Loom / **Care** / **Repair** as label-value pairs from `custom.*` metafields. Keep
  writing care and repair guidance as clear Q&A-shaped HTML with real headings; skip the JSON-LD.
- **LocalBusiness — not eligible; use `OnlineStore` instead.** Google restricts LocalBusiness to
  businesses customers can visit or that travel to customers. A by-appointment atelier
  (`atelier.tsx:49`) is borderline at best. `OnlineStore` (a subtype of Organization, used in Google's
  own example) is the correct type here.
- **`WebSite.potentialAction` / SearchAction — do NOT add.** Google deprecated the sitelinks search box
  in Oct 2024 and removed it Nov 2024. (The absence of a `/search` route in `app/routes/` is still a
  genuine searchability and UX gap in its own right — just not a structured-data one.)
- **RSS/Atom feed — low priority.** Google still accepts feeds as a sitemap alternative, but there is
  no evidence any AI crawler consumes site feeds. Build one for human readers if you want; not for AI.
- **Homepage features a mock.shop handle.** `_index.tsx:31` `FEATURED_HANDLE = 'automated-collection'`
  with a silent fallback to "first collection" (`_index.tsx:62-68`) — the live homepage may feature an
  arbitrary collection. LAUNCH.md flags this as a TODO; it's a content-quality signal that AI
  summarisers read.
- **Description truncation is mid-word** — `seo.ts:103` slices at 160 chars, `:179` regex-strips HTML
  then slices. Trim at a word boundary and add an ellipsis. Note Hydrogen `console.warn`s over 70-char
  titles and 155-char descriptions, and the root `titleTemplate` `%s · Sisu` (`seo.ts:52`) adds 6
  characters to every route title.
- **`/cart` and `/account` are both `Disallow`ed *and* `noindex`ed** (`[robots.txt].tsx:8-9` vs
  `cart.tsx:48`, `account.tsx:9`). A disallowed page is never fetched, so the `noindex` is never read.
  Harmless here, but pick one mechanism.
- **No `Cache-Control` on HTML document responses**; `[robots.txt].tsx:18` and `[sitemap.xml].tsx:38`
  set `max-age` but no `s-maxage`/`stale-while-revalidate` for the Oxygen edge.
- **The journal URL shape diverges from Shopify's.** Shopify's canonical blog URL is
  `/blogs/<blog>/<article>`; this app serves `/journal/<handle>` (`app/routes/journal.$handle.tsx`).
  Anything that generates Online Store URLs — the Shop app, a Merchant Center feed, an emailed link —
  will 404 on the Hydrogen site. `server.ts:46-50` runs `storefrontRedirect` on 404s, which consults
  Shopify's redirect table, so the mitigation is to add `/blogs/journal/* → /journal/*` redirects in
  admin. Low risk while the store has never been public; worth doing before it is.
- **Upgrade `@shopify/hydrogen` 2026.4.2 → 2026.4.5** (released 2026-08-14).

---

# Adjacent, outside the audit's scope

The newsletter form (`Newsletter.tsx:33-38`) does not submit anywhere — `onSubmit` calls
`preventDefault()` and sets local state. It renders the thank-you message and discards the address.
Not an SEO issue, but the footer links to it (`Footer.tsx:31`) and it's the site's only capture point.

---

# Note: the repo changed under me during this audit

`git status` was clean at session start. It now shows `HANDOFF.md`, `LAUNCH.md`, `README.md` modified
and an untracked `docs/OWNERS-GUIDE.md`, with mtimes of 13:02–13:12 today — during this session.
**I made none of these changes; this audit wrote nothing outside its own scratchpad.** Another session
or editor is working in the repo concurrently.

One consequence for this report: LAUNCH.md:11 said "Decide + flip `USE_MOCK_DATA`" when I read it and
now says the mock-data question is resolved. All other file:line references were re-checked or are in
`app/`, which is untouched (`git status --porcelain app/` is empty). `docs/OWNERS-GUIDE.md` contains no
SEO content (grepped for seo/sitemap/robots/llms/agents.md/schema/canonical — zero hits), so it doesn't
affect any finding.

---

# Sources

**Crawler / robots.txt:** [RFC 9309](https://www.rfc-editor.org/rfc/rfc9309.html) ·
[OpenAI bots](https://developers.openai.com/api/docs/bots) ·
[Anthropic crawlers](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler) ·
[Perplexity bots](https://docs.perplexity.ai/guides/bots) ·
[Google crawlers](https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers) ·
[Google AI features](https://developers.google.com/search/docs/appearance/ai-features) ·
[Cloudflare AI Crawl Control](https://developers.cloudflare.com/ai-crawl-control/get-started/)

**AEO / structured data:** [Google AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) ·
[Merchant listing schema](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing) ·
[Organization schema](https://developers.google.com/search/docs/appearance/structured-data/organization) ·
[Org-level shipping, Nov 2025](https://developers.google.com/search/blog/2025/11/more-ways-to-share-shipping) ·
[identifier_exists / handmade goods](https://support.google.com/merchants/answer/6324478) ·
[FAQPage removal](https://developers.google.com/search/docs/appearance/structured-data/faqpage) ·
[Sitelinks searchbox deprecation](https://developers.google.com/search/docs/appearance/structured-data/sitelinks-searchbox) ·
[Article schema](https://developers.google.com/search/docs/appearance/structured-data/article) ·
[Sitemap lastmod](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) ·
[Googlebot 2MB limit](https://developers.google.com/search/blog/2026/03/crawler-blog-post) ·
[Open Graph spec](https://ogp.me/)

**Studies:** [Ahrefs — schema vs AI citations](https://ahrefs.com/blog/schema-ai-citations/) ·
[Ahrefs — brand mentions correlation](https://ahrefs.com/blog/ai-overview-brand-correlation/) ·
[Semrush AI Visibility Index](https://www.semrush.com/news/463141-semrush-releases-expanded-2026-ai-visibility-index-analyzing-126-million-ai-search-prompts/) ·
[Vercel/MERJ — AI crawlers and JS](https://vercel.com/blog/the-rise-of-the-ai-crawler) ·
[searchviu — JS rendering by crawler](https://www.searchviu.com/en/ai-crawlers-javascript-rendering/) ·
[Mueller on llms.txt](https://www.searchenginejournal.com/google-says-llms-txt-comparable-to-keywords-meta-tag/544804/)

**Shopify agentic commerce:** [Shopify agents docs](https://shopify.dev/docs/agents) ·
[Staff: headless custom domains cannot self-host the UCP manifest](https://community.shopify.dev/t/how-to-get-well-known-ucp-on-shopify-plus-with-a-custom-headless-storefront/28470) ·
[Staff: llms.txt / agents.md rollout](https://community.shopify.dev/t/llms-txt-and-agents-md/34049) ·
[Google + Shopify agentic commerce / UCP](https://blog.google/products/ads-commerce/agentic-commerce-ai-tools-protocol-retailers-platforms/) ·
[OpenAI commerce feed spec](https://developers.openai.com/commerce/specs/feed)

**Primary evidence gathered first-hand:** live curl of sisuhomeware.com / www / the myshopify domain /
the Oxygen URL / `/password` / `/robots.txt` / `/agents.md` / `/.well-known/ucp`; the installed
`@shopify/hydrogen` 2026.4.2 bundle and its `storefront-api-types.d.ts`; and `getSeoMeta` executed
directly under Node to confirm emitted tags.
