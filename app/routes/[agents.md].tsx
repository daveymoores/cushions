import type {Route} from './+types/[agents.md]';
import {siteOrigin} from '~/lib/seo';

/**
 * `/agents.md` — Shopify's canonical agent-discovery file, and the one piece of
 * that surface a headless storefront has to serve itself.
 *
 * On an Online Store this is generated from the `agents-md.liquid` theme
 * template and linked from Shopify's own robots.txt. Oxygen inherits none of
 * it, so without this route the brand domain loses agent discovery the day the
 * domain is cut over. (`/.well-known/ucp` is the opposite case: Shopify serves
 * it and it cannot be self-hosted — enable "Agentic storefronts" in admin.)
 *
 * The MCP path below is the one Hydrogen's own request handler proxies:
 * `createRequestHandler` matches `/^\/api\/mcp$/` and forwards to
 * `<shop>.myshopify.com/api/mcp`. Shopify's Online Store robots.txt advertises
 * `/api/ucp/mcp`; that path is NOT proxied by the installed Hydrogen
 * (2026.4.2, and unchanged in 2026.4.5), so advertising it here would 404.
 * Re-check after any Hydrogen upgrade.
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

- [Collections](${site}/collections): all cushion collections
- [Fabrics](${site}/materials): the deadstock fabrics behind each cushion
- [The Atelier](${site}/atelier): who makes the cushions, and how
- [Journal](${site}/journal): notes on deadstock fabric and making

## Commerce

- Product catalogue and cart: MCP endpoint at ${site}/api/mcp
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
