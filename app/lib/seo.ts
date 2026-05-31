/**
 * SEO helpers. Each function returns a Hydrogen `SeoConfig` that `getSeoMeta`
 * turns into <title>, meta description, canonical, Open Graph + Twitter tags,
 * and JSON-LD structured data. Route `meta` functions merge the root config
 * with the route config: `getSeoMeta(rootData.seo, data.seo)`.
 */
import {getSeoMeta, type SeoConfig} from '@shopify/hydrogen';
import type {Product, Collection} from '~/lib/mock-data';

export const SITE_NAME = 'Sisu';

/**
 * Merge the site-wide root SEO config (from the root loader) with this route's
 * SEO config into the meta-tag array React Router renders. Call from a route
 * `meta` export: `({data, matches}) => routeMeta(matches, data?.seo)`.
 */
export function routeMeta(
  matches: Array<{data?: unknown} | undefined>,
  routeSeo?: SeoConfig,
) {
  const root = (matches?.[0]?.data as {seo?: SeoConfig} | undefined)?.seo;
  return getSeoMeta(root ?? {}, routeSeo ?? {}) ?? [];
}

/** Loose image shape accepted by the SEO helpers (raw Storefront or view-model). */
type SeoImageInput = {
  url: string;
  width?: number | null;
  height?: number | null;
  altText?: string | null;
} | null | undefined;
const SITE_DESCRIPTION =
  'Heirloom cushions, sewn to order in north London. Linen, velvet, and undyed wool, repaired for life.';

type JsonLd = NonNullable<SeoConfig['jsonLd']>;

/** Canonical URL for the current request (origin + path, no query string). */
export function canonical(request: Request): string {
  const url = new URL(request.url);
  return url.origin + url.pathname;
}

export function origin(request: Request): string {
  return new URL(request.url).origin;
}

/** Site-wide defaults + Organization/WebSite structured data. */
export function rootSeo(request: Request): SeoConfig {
  const site = origin(request);
  return {
    title: SITE_NAME,
    titleTemplate: `%s · ${SITE_NAME}`,
    description: SITE_DESCRIPTION,
    url: site,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        url: site,
        description: SITE_DESCRIPTION,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        url: site,
      },
    ] as JsonLd,
  };
}

function imageMedia(image: SeoImageInput) {
  if (!image) return undefined;
  return {
    url: image.url,
    width: image.width || undefined,
    height: image.height || undefined,
    altText: image.altText ?? undefined,
  };
}

function breadcrumb(site: string, trail: {name: string; path: string}[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      item: site + t.path,
    })),
  } as JsonLd;
}

export function productSeo(product: Product, request: Request): SeoConfig {
  const url = canonical(request);
  const site = origin(request);
  const inStock = product.variants.nodes.some((v) => v.availableForSale);
  return {
    title: product.title,
    description:
      product.description?.slice(0, 160) || `${product.title} — ${SITE_NAME}`,
    url,
    media: imageMedia(product.featuredImage),
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.title,
        description: product.description,
        image: product.images.map((i) => i.url),
        brand: {'@type': 'Brand', name: product.vendor || SITE_NAME},
        offers: {
          '@type': 'Offer',
          price: product.priceRange.minVariantPrice.amount,
          priceCurrency: product.priceRange.minVariantPrice.currencyCode,
          availability: inStock
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          url,
        },
      },
      breadcrumb(site, [
        {name: 'Home', path: '/'},
        {name: 'Shop', path: '/collections'},
        {name: product.title, path: `/products/${product.handle}`},
      ]),
    ] as JsonLd,
  };
}

export function collectionSeo(
  collection: Collection,
  request: Request,
): SeoConfig {
  const url = canonical(request);
  const site = origin(request);
  return {
    title: collection.title,
    description:
      collection.description?.slice(0, 160) ||
      `${collection.title} — cushions by ${SITE_NAME}.`,
    url,
    media: imageMedia(collection.image),
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: collection.title,
        description: collection.description,
        url,
      },
      breadcrumb(site, [
        {name: 'Home', path: '/'},
        {name: 'Collections', path: '/collections'},
        {name: collection.title, path: `/collections/${collection.handle}`},
      ]),
    ] as JsonLd,
  };
}

export function articleSeo(
  article: {
    title: string;
    contentHtml?: string;
    publishedAt?: string | null;
    author?: {name: string} | null;
    image?: SeoImageInput;
    seo?: {description?: string | null} | null;
  },
  request: Request,
): SeoConfig {
  const url = canonical(request);
  return {
    title: article.title,
    description:
      article.seo?.description ||
      article.contentHtml?.replace(/<[^>]+>/g, '').slice(0, 160) ||
      `${article.title} — from the ${SITE_NAME} journal.`,
    url,
    media: imageMedia(article.image),
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: article.title,
      image: article.image ? [article.image.url] : undefined,
      datePublished: article.publishedAt ?? undefined,
      author: article.author?.name
        ? {'@type': 'Person', name: article.author.name}
        : undefined,
      publisher: {'@type': 'Organization', name: SITE_NAME},
      mainEntityOfPage: url,
    } as JsonLd,
  };
}

export function pageSeo(
  page: {title: string; body?: string; seo?: {description?: string | null} | null},
  request: Request,
): SeoConfig {
  const url = canonical(request);
  return {
    title: page.title,
    description:
      page.seo?.description ||
      page.body?.replace(/<[^>]+>/g, '').slice(0, 160) ||
      `${page.title} — ${SITE_NAME}.`,
    url,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: page.title,
      url,
    } as JsonLd,
  };
}

/** Simple title/description/canonical for a static-ish page (no rich JSON-LD). */
export function basicSeo(
  opts: {title: string; description?: string; request: Request; noIndex?: boolean},
): SeoConfig {
  return {
    title: opts.title,
    description: opts.description ?? SITE_DESCRIPTION,
    url: canonical(opts.request),
    robots: opts.noIndex ? {noIndex: true, noFollow: false} : undefined,
  };
}
