/**
 * SEO helpers. Each function returns a Hydrogen `SeoConfig` that `getSeoMeta`
 * turns into <title>, meta description, canonical, Open Graph + Twitter tags,
 * and JSON-LD structured data. Route `meta` functions merge the root config
 * with the route config: `getSeoMeta(rootData.seo, data.seo)`.
 */
import {getSeoMeta, type SeoConfig} from '@shopify/hydrogen';
import type {Product, Collection} from '~/lib/mock-data';
import {usesMockData} from '~/lib/storefront';

export const SITE_NAME = 'Sisu';

/** `og:type` values we set. Defaults to `website`. */
export type OgType = 'website' | 'product' | 'article';

type MetaDescriptor = Record<string, unknown>;

/**
 * Merge the site-wide root SEO config (from the root loader) with this route's
 * SEO config into the meta-tag array React Router renders. Call from a route
 * `meta` export: `({data, matches}) => routeMeta(matches, data?.seo)`.
 *
 * `getSeoMeta` never emits a bare `og:image`, `og:type`, `og:site_name`,
 * `og:locale`, `twitter:card` or `twitter:image` — only the `og:image:*`
 * structured block. Twitter/X, Slack, LinkedIn, Discord and WhatsApp are all
 * documented against the bare tag, so we add it here.
 *
 * Runs in the browser on client navigation, so it must not touch `env` — the
 * canonical origin is already baked into the loader-produced configs.
 */
export function routeMeta(
  matches: Array<{data?: unknown} | undefined>,
  routeSeo?: SeoConfig,
  ogType: OgType = 'website',
) {
  const root = (matches?.[0]?.data as {seo?: SeoConfig} | undefined)?.seo;
  const tags = (
    (getSeoMeta(root ?? {}, routeSeo ?? {}) ?? []) as MetaDescriptor[]
  ).map((tag) => {
    // The title template appends " · Sisu" to every title, including the
    // site-wide default — which already names the brand. Undo it there only,
    // so route titles keep the suffix and the default reads as written.
    const next: MetaDescriptor = {...tag};
    for (const key of ['title', 'content'] as const) {
      if (next[key] === TEMPLATED_SITE_TITLE) next[key] = SITE_TITLE;
    }
    return next;
  });

  // `og:image:url` is what Hydrogen emits for object media; it carries the
  // same URL the bare `og:image` needs.
  const imageUrl = tags.find((t) => t.property === 'og:image:url')?.content;

  if (typeof imageUrl === 'string' && imageUrl) {
    // Order matters: the OG spec treats `og:image:*` as structured properties
    // of the preceding root `og:image` tag, so the bare tag must come first.
    const at = tags.findIndex(
      (t) => typeof t.property === 'string' && t.property.startsWith('og:image'),
    );
    tags.splice(at < 0 ? tags.length : at, 0, {
      property: 'og:image',
      content: imageUrl,
    });
  }

  tags.push(
    {property: 'og:type', content: ogType},
    {property: 'og:site_name', content: SITE_NAME},
    {property: 'og:locale', content: 'en_GB'},
    {name: 'twitter:card', content: 'summary_large_image'},
  );
  if (typeof imageUrl === 'string' && imageUrl) {
    tags.push({name: 'twitter:image', content: imageUrl});
  }

  return tags;
}

/** Loose image shape accepted by the SEO helpers (raw Storefront or view-model). */
type SeoImageInput = {
  url: string;
  width?: number | null;
  height?: number | null;
  altText?: string | null;
} | null | undefined;
/** Site-wide default title, used whenever a route sets none of its own. */
export const SITE_TITLE = 'Sisu — cushions made from deadstock fabric';

const TITLE_SUFFIX = ` · ${SITE_NAME}`;
/** What the title template makes of the default title — see `routeMeta`. */
const TEMPLATED_SITE_TITLE = SITE_TITLE + TITLE_SUFFIX;

const SITE_DESCRIPTION =
  'Cushions cut and sewn in small batches in Amsterdam from deadstock fabric — surplus rolls given a second life. Feather-filled, finished by hand, naturally limited.';

type JsonLd = NonNullable<SeoConfig['jsonLd']>;

/**
 * The one authority for the site's public origin, with no trailing slash.
 *
 * Prefers `PUBLIC_SITE_URL` so every host that reaches the app — the Oxygen
 * preview domain, `www.`, the myshopify domain — canonicalises back to the
 * brand domain instead of publishing itself as a duplicate site. Falls back to
 * the request origin when the variable is unset (local dev, or a misconfigured
 * deployment, where self-canonicalising is the least-wrong default).
 */
export function siteOrigin(request: Request, env: Env): string {
  const configured = env?.PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');
  return new URL(request.url).origin;
}

/** Canonical URL for the current request (site origin + path, no query string). */
export function canonical(request: Request, env: Env): string {
  return siteOrigin(request, env) + new URL(request.url).pathname;
}

/** Site-wide defaults + Organization/WebSite structured data. */
export function rootSeo(
  request: Request,
  env: Env,
  media?: SeoImageInput,
): SeoConfig {
  const site = siteOrigin(request, env);
  return {
    title: SITE_TITLE,
    titleTemplate: `%s${TITLE_SUFFIX}`,
    description: SITE_DESCRIPTION,
    url: site,
    // Root-level media is inherited by every route that sets none, so the
    // homepage hero doubles as the site-wide share image.
    media: imageMedia(media),
    // Safety net: if PUBLIC_STORE_DOMAIN is unset or wrong, the app silently
    // serves mock products with invented prices. A root-level `robots` config
    // propagates to every route that doesn't override it, so this one line
    // keeps the whole fake site out of the index.
    ...(usesMockData(env) ? {robots: {noIndex: true, noFollow: true}} : {}),
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

export function productSeo(
  product: Product,
  request: Request,
  env: Env,
): SeoConfig {
  const url = canonical(request, env);
  const site = siteOrigin(request, env);
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
  env: Env,
): SeoConfig {
  const url = canonical(request, env);
  const site = siteOrigin(request, env);
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
  env: Env,
): SeoConfig {
  const url = canonical(request, env);
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
  env: Env,
): SeoConfig {
  const url = canonical(request, env);
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
  opts: {
    title: string;
    description?: string;
    request: Request;
    env: Env;
    noIndex?: boolean;
  },
): SeoConfig {
  return {
    title: opts.title,
    description: opts.description ?? SITE_DESCRIPTION,
    url: canonical(opts.request, opts.env),
    robots: opts.noIndex ? {noIndex: true, noFollow: false} : undefined,
  };
}
