import type {Route} from './+types/[llms.txt]';
import {siteOrigin} from '~/lib/seo';
import {SHOP_COLLECTION_HANDLE} from '~/lib/nav';

/**
 * `/llms.txt` — cheap insurance, not a needle-mover. No major vendor has
 * committed to reading it (Google says it ignores it), and Shopify's own
 * storefronts redirect it to /agents.md. It exists here because it costs
 * twenty lines and some agentic tooling looks for it. `/agents.md` is the
 * file that carries the detail — including why each commerce endpoint below
 * is listed for what it is. Keep the two files' pages and endpoints in step.
 */
export async function loader({context, request}: Route.LoaderArgs) {
  const site = siteOrigin(request, context.env);
  const body = `# Sisu

> Cushions made from deadstock fabric — surplus rolls given a second life.
> Cut and sewn in small batches in Amsterdam, feather-filled and finished by
> hand. Every design is naturally limited.

## Docs

- [Agent guide](${site}/agents.md): full description, key pages, commerce endpoints
- [Shop](${site}/collections/${SHOP_COLLECTION_HANDLE}): every cushion currently for sale
- [About](${site}/atelier): who makes the cushions, and how
- [Fabrics](${site}/materials): the deadstock fabrics behind each cushion
- [Journal](${site}/journal): notes on deadstock fabric and making

## Optional

- [Sitemap](${site}/sitemap.xml)
- Commerce: UCP manifest at ${site}/.well-known/ucp; catalogue, cart and
  checkout over MCP at ${site}/api/ucp/mcp; store policies and FAQs over MCP
  at ${site}/api/mcp. Checkout requires explicit human approval.
`;

  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'max-age=3600',
    },
  });
}
