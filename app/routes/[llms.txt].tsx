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

> Cushions made from deadstock fabric — surplus rolls given a second life.
> Cut and sewn in small batches in Amsterdam, feather-filled and finished by
> hand. Every design is naturally limited.

## Docs

- [Agent guide](${site}/agents.md): full description, key pages, commerce endpoints
- [Collections](${site}/collections): all cushion collections
- [Fabrics](${site}/materials): the deadstock fabrics behind each cushion
- [The Atelier](${site}/atelier): who makes the cushions, and how
- [Journal](${site}/journal): notes on deadstock fabric and making

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
