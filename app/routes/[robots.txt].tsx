import type {Route} from './+types/[robots.txt]';
import {siteOrigin} from '~/lib/seo';

/**
 * The `*` group is deliberately permissive and deliberately the only group.
 *
 * Under RFC 9309 a crawler obeys the single group matching its own token and
 * ignores `*` entirely — groups are not merged. So adding `User-agent: GPTBot`
 * (or ClaudeBot, PerplexityBot, …) would *un-protect* /cart and /account for
 * exactly those crawlers unless every Disallow were repeated in each group.
 * A permissive `*` already allows all of them. Do not add named AI-bot groups.
 */
export async function loader({context, request}: Route.LoaderArgs) {
  const site = siteOrigin(request, context.env);
  const body = [
    '# Sisu — heirloom cushions, sewn to order in north London.',
    `# Agents: see ${site}/agents.md for a structured description of this store,`,
    `# and ${site}/llms.txt for the short form.`,
    '',
    'User-agent: *',
    'Allow: /',
    'Disallow: /cart',
    'Disallow: /account',
    '',
    `Sitemap: ${site}/sitemap.xml`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'content-type': 'text/plain',
      'cache-control': 'max-age=86400',
    },
  });
}
