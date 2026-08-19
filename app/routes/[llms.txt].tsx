import type {Route} from './+types/[llms.txt]';
import {siteOrigin} from '~/lib/seo';

/**
 * `/llms.txt` — cheap insurance, not a needle-mover. No major vendor has
 * committed to reading it (Google says it ignores it), and Shopify's own
 * storefronts redirect it to /agents.md. It exists here because it costs
 * twenty lines and some agentic tooling looks for it. `/agents.md` is the
 * file that carries the detail.
 */
export async function loader({context, request}: Route.LoaderArgs) {
  const site = siteOrigin(request, context.env);
  const body = `# Sisu

> Heirloom cushions, sewn to order in north London. Linen, cotton velvet and
> undyed wool, cut and sewn by hand and repaired for life. Ships from the UK,
> prices in GBP.

## Docs

- [Agent guide](${site}/agents.md): full description, key pages, commerce endpoints
- [Collections](${site}/collections): all cushion collections, by material
- [Materials](${site}/materials): the cloths we work and why
- [The Atelier](${site}/atelier): how and where the work is done; commissions
- [Journal](${site}/journal): notes on materials, mending and making

## Optional

- [Sitemap](${site}/sitemap.xml)
- Commerce: MCP endpoint at ${site}/api/mcp. Checkout requires explicit human
  approval.
`;

  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'max-age=3600',
    },
  });
}
