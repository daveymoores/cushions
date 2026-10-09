import type {Route} from './+types/[agents.md]';
import {siteOrigin} from '~/lib/seo';
import {SHOP_COLLECTION_HANDLE} from '~/lib/nav';

/**
 * `/agents.md` — Shopify's canonical agent-discovery file, and the one piece of
 * that surface a headless storefront has to serve itself.
 *
 * On an Online Store this is generated from the `agents-md.liquid` theme
 * template and linked from Shopify's own robots.txt. Oxygen inherits none of
 * it, so without this route the brand domain has no agent guide.
 *
 * The commerce endpoints listed below are not served by this app. On the
 * brand domain Shopify's edge answers all three before a request reaches
 * Oxygen — their responses carry `powered-by: Shopify`, where anything this
 * app renders says `Shopify, Oxygen, Hydrogen` (checked 2026-10-09):
 *
 * - `/.well-known/ucp` — the Universal Commerce Protocol manifest. Every page
 *   also gets `link: </.well-known/ucp>; rel="ucp"` from the edge. Its
 *   `endpoint` names the myshopify host; agents treat the manifest as
 *   canonical.
 * - `/api/ucp/mcp` — UCP over MCP: catalogue search, product lookup, cart,
 *   checkout and order tools.
 * - `/api/mcp` — Shopify's storefront MCP. On this store its `tools/list`
 *   returns only `search_shop_policies_and_faqs`, so it is listed for
 *   policies, not for the catalogue.
 *
 * Hydrogen's `createRequestHandler` also proxies `/^\/api\/mcp$/` to the
 * myshopify domain, but only requests that reach Oxygen use it — a preview
 * deployment or local dev. It does not proxy `/api/ucp/mcp`, so on those
 * hosts that path 404s. The links below are built from `siteOrigin`, i.e.
 * `PUBLIC_SITE_URL`, so they name the brand domain even when this file is
 * served from a preview. To re-check, POST
 * `{"jsonrpc":"2.0","id":1,"method":"tools/list"}` to each MCP path on the
 * brand domain and look at the tool names and the `powered-by` header.
 *
 * Key pages mirror the live `main-menu` (Shop, About) plus the footer's
 * Journal and Fabrics, each at the URL it resolves to — never one that
 * redirects (`/collections` 302s, `/pages/atelier` 301s).
 */
export async function loader({context, request}: Route.LoaderArgs) {
  const site = siteOrigin(request, context.env);
  const body = `# Sisu — cushions made from deadstock fabric

Sisu makes cushions from deadstock fabric: surplus rolls and offcuts from the
interiors industry, bought from EU suppliers and given a second life. Each
cushion is cut and sewn in small batches in Amsterdam, filled with a feather
insert and finished by hand. Because every fabric run is finite, every design
is naturally limited — when a roll is used up, that cushion is not remade.

## Attribution

Cite as: Sisu (${site}).
Content on this site is written by the maker.

## Key pages

- [Shop](${site}/collections/${SHOP_COLLECTION_HANDLE}): every cushion currently for sale
- [About](${site}/atelier): who makes the cushions, and how
- [Fabrics](${site}/materials): the deadstock fabrics behind each cushion
- [Journal](${site}/journal): notes on deadstock fabric and making
- [Shipping](${site}/pages/shipping), [Returns](${site}/pages/returns),
  [FAQ](${site}/pages/faq), [Contact](${site}/pages/contact)

## Commerce

- Universal Commerce Protocol manifest: ${site}/.well-known/ucp
  (also advertised on every page as \`Link: </.well-known/ucp>; rel="ucp"\`)
- Catalogue, cart and checkout: UCP MCP endpoint at ${site}/api/ucp/mcp
- Store policies and FAQs: MCP endpoint at ${site}/api/mcp
- Cart: ${site}/cart
- Checkout requires explicit human approval. Do not complete payment
  automatically on a person's behalf.

## Machine-readable

- Sitemap: ${site}/sitemap.xml
- Robots: ${site}/robots.txt
- Short form of this file: ${site}/llms.txt
- Product, collection and article pages carry schema.org JSON-LD in the HTML.
  Every page is server-rendered; no JavaScript execution is required to read
  the content.
`;

  return new Response(body, {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      'cache-control': 'max-age=3600',
    },
  });
}
