import type {Route} from './+types/[sitemap.xml]';
import {SITEMAP_QUERY} from '~/lib/queries';
import {usesMockData} from '~/lib/storefront';
import {siteOrigin} from '~/lib/seo';

const STATIC_PATHS = [
  '/',
  '/collections',
  '/journal',
  '/materials',
  '/atelier',
];

/** Handle of the Shopify blog rendered at /journal. */
const BLOG_HANDLE = 'journal';

/**
 * Page handles that 301 elsewhere (see `pages.$handle.tsx`) — listing them
 * would put a redirect in the sitemap.
 */
const REDIRECTED_PAGE_HANDLES = new Set(['atelier']);

type Entry = {loc: string; lastmod?: string | null};

/** Google reads `lastmod` when it's accurate, and ignores changefreq/priority. */
function urlTag({loc, lastmod}: Entry): string {
  const modified = lastmod ? `<lastmod>${lastmod}</lastmod>` : '';
  return `  <url><loc>${loc}</loc>${modified}</url>`;
}

export async function loader({context, request}: Route.LoaderArgs) {
  const origin = siteOrigin(request, context.env);
  const entries: Entry[] = STATIC_PATHS.map((p) => ({loc: origin + p}));

  if (!usesMockData(context.env)) {
    const {products, collections, pages, blog} = await context.storefront.query(
      SITEMAP_QUERY,
      {variables: {first: 250, blog: BLOG_HANDLE}},
    );
    entries.push(
      ...products.nodes.map((p) => ({
        loc: `${origin}/products/${p.handle}`,
        lastmod: p.updatedAt,
      })),
      ...collections.nodes.map((c) => ({
        loc: `${origin}/collections/${c.handle}`,
        lastmod: c.updatedAt,
      })),
      ...pages.nodes
        .filter((p) => !REDIRECTED_PAGE_HANDLES.has(p.handle))
        .map((p) => ({
          loc: `${origin}/pages/${p.handle}`,
          lastmod: p.updatedAt,
        })),
      // Storefront `Article` exposes no `updatedAt` — `publishedAt` is the only
      // date available, so that's what lastmod reports.
      ...(blog?.articles.nodes ?? []).map((a) => ({
        loc: `${origin}/journal/${a.handle}`,
        lastmod: a.publishedAt,
      })),
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(urlTag).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'content-type': 'application/xml',
      'cache-control': 'max-age=3600',
    },
  });
}
