import type {Route} from './+types/[robots.txt]';

export async function loader({request}: Route.LoaderArgs) {
  const {origin} = new URL(request.url);
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /cart',
    'Disallow: /account',
    '',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'content-type': 'text/plain',
      'cache-control': 'max-age=86400',
    },
  });
}
