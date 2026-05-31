import type {Route} from './+types/[sitemap.xml]';
import {SITEMAP_QUERY} from '~/lib/queries';
import {usesMockData} from '~/lib/storefront';

const STATIC_PATHS = [
  '/',
  '/collections',
  '/journal',
  '/materials',
  '/atelier',
];

export async function loader({context, request}: Route.LoaderArgs) {
  const {origin} = new URL(request.url);
  const locs = STATIC_PATHS.map((p) => origin + p);

  if (!usesMockData(context.env)) {
    const {products, collections} = await context.storefront.query(
      SITEMAP_QUERY,
      {variables: {first: 250}},
    );
    locs.push(
      ...products.nodes.map((p) => `${origin}/products/${p.handle}`),
      ...collections.nodes.map((c) => `${origin}/collections/${c.handle}`),
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${locs
  .map((loc) => `  <url><loc>${loc}</loc></url>`)
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'content-type': 'application/xml',
      'cache-control': 'max-age=3600',
    },
  });
}
