import type {Route} from './+types/feeds.[products.xml]';
import type {ProductFeedQuery} from 'storefrontapi.generated';
import {PRODUCT_FEED_QUERY} from '~/lib/queries';
import {isVisibleCollection} from '~/lib/adapters';
import {usesMockData} from '~/lib/storefront';
import {SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, siteOrigin} from '~/lib/seo';

/**
 * `/feeds/products.xml` — one shopping feed for Pinterest Catalogs, Microsoft
 * Merchant Center and Meta Commerce Manager, all of which read Google's RSS 2.0
 * product format. One `<item>` per variant, grouped by product.
 *
 * The Storefront API only returns products published to this channel, so
 * there is no publish filter here. Variants without a price are skipped.
 * Under mock data the channel is empty: a feed of invented prices must never
 * reach an ad platform.
 */

/** Google's taxonomy entry for cushions; every Sisu product is one. */
const GOOGLE_PRODUCT_CATEGORY = 'Home & Garden > Decor > Throw Pillows';

/** The feed format allows at most ten additional images. */
const MAX_ADDITIONAL_IMAGES = 10;

/** Google truncates descriptions beyond this. */
const MAX_DESCRIPTION = 5000;

type FeedProduct = ProductFeedQuery['products']['nodes'][number];
type FeedVariant = FeedProduct['variants']['nodes'][number];

/**
 * Escape text for an XML element body. Also drops the control characters XML
 * 1.0 forbids outright, which escaping can't make legal.
 */
function xml(text: string): string {
  return text
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** `gid://shopify/ProductVariant/123` → `123`. */
function numericId(gid: string): string {
  return gid.slice(gid.lastIndexOf('/') + 1);
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

/**
 * Plain text from Shopify rich text: tags become spaces (so adjacent
 * paragraphs don't run together), entities are decoded so they aren't
 * double-escaped later, and whitespace is collapsed.
 */
function plainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, ref: string) => {
      if (ref[0] === '#') {
        const code =
          ref[1] === 'x' || ref[1] === 'X'
            ? parseInt(ref.slice(2), 16)
            : parseInt(ref.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : match;
      }
      return ENTITIES[ref.toLowerCase()] ?? match;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

/** The value of the option with one of these names, case-insensitive. */
function optionValue(variant: FeedVariant, names: string[]): string | null {
  const option = variant.selectedOptions.find((o) =>
    names.includes(o.name.toLowerCase()),
  );
  return option?.value ?? null;
}

function tag(name: string, value: string | null | undefined): string {
  return value ? `      <g:${name}>${xml(value)}</g:${name}>` : '';
}

function itemTag(
  product: FeedProduct,
  variant: FeedVariant,
  origin: string,
): string {
  const multiVariant = product.variants.nodes.length > 1;
  const variantId = numericId(variant.id);
  const link =
    `${origin}/products/${product.handle}` +
    (multiVariant ? `?variant=${variantId}` : '');

  const productImages = product.images.nodes.map((i) => i.url);
  const mainImage = variant.image?.url ?? productImages[0];
  const additional = productImages
    .filter((url) => url !== mainImage)
    .slice(0, MAX_ADDITIONAL_IMAGES);

  const description =
    plainText(product.descriptionHtml).slice(0, MAX_DESCRIPTION) ||
    product.title;
  const productType =
    product.productType ||
    product.collections.nodes.find(isVisibleCollection)?.title;
  const {amount, currencyCode} = variant.price;

  const lines = [
    tag('id', variantId),
    tag('item_group_id', numericId(product.id)),
    tag(
      'title',
      multiVariant ? `${product.title} - ${variant.title}` : product.title,
    ),
    tag('description', description),
    tag('link', link),
    tag('image_link', mainImage),
    ...additional.map((url) => tag('additional_image_link', url)),
    tag('price', `${Number(amount).toFixed(2)} ${currencyCode}`),
    tag('availability', variant.availableForSale ? 'in_stock' : 'out_of_stock'),
    tag('condition', 'new'),
    tag('brand', SITE_NAME),
    // Handmade, so there is no GTIN or MPN to give.
    tag('identifier_exists', 'false'),
    tag('product_type', productType),
    tag('google_product_category', GOOGLE_PRODUCT_CATEGORY),
    tag('color', optionValue(variant, ['color', 'colour'])),
    tag('size', optionValue(variant, ['size'])),
  ].filter(Boolean);

  return `    <item>\n${lines.join('\n')}\n    </item>`;
}

export async function loader({context, request}: Route.LoaderArgs) {
  const origin = siteOrigin(request, context.env);
  const items: string[] = [];

  if (!usesMockData(context.env)) {
    const {products} = await context.storefront.query(PRODUCT_FEED_QUERY, {
      variables: {first: 250},
    });
    for (const product of products.nodes) {
      for (const variant of product.variants.nodes) {
        if (!variant.price?.amount) continue;
        items.push(itemTag(product, variant, origin));
      }
    }
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${xml(SITE_TITLE)}</title>
    <link>${xml(origin)}</link>
    <description>${xml(SITE_DESCRIPTION)}</description>
${items.join('\n')}
  </channel>
</rss>`;

  return new Response(body, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'max-age=3600',
    },
  });
}
