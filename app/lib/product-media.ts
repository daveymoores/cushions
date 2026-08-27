/**
 * Product media grouping — deciding which photographs belong in the carousel
 * and which are lifestyle ("in situ") shots shown further down the page.
 *
 * A product's images arrive from Shopify as one flat list: studio front/back
 * shots, fabric swatches and room photography all together. The split is
 * declared by the merchant, not inferred:
 *
 *   `custom.in_situ_images` — a File list (`list.file_reference`) on the
 *   product, Storefront access PUBLIC_READ. Whatever it references is the
 *   in-situ set. Everything else stays in the carousel.
 *
 * So the whole rule is a set subtraction:
 *
 *   inSitu    = the metafield's references
 *   carousel  = product.images − inSitu
 *
 * Fabric swatches need no special handling: they simply aren't referenced, so
 * they stay in the carousel as material information beside the product.
 *
 * Authoring, in Shopify admin: open a product → Metafields → "In situ images" →
 * pick the room shots. A product with none set shows no in-situ section, and a
 * photograph nobody ticks stays in the carousel — the safe direction to fail.
 * The merchant may also reference images that were uploaded to Files rather
 * than added as product media; those were never carousel candidates and are
 * carried through unchanged.
 *
 * There is deliberately no fallback that guesses from alt text. An earlier
 * draft did, and Leonie's "Fabric swatch — botanical collage jacquard on navy"
 * is exactly why it was dropped: a swatch that reads like a room shot.
 */
import type {ImageT, Product} from '~/lib/mock-data';

export type ProductMediaGroups = {
  /** Images for the main carousel: studio shots and fabric swatches. */
  carousel: ImageT[];
  /** Lifestyle photography for the "Lived with" section. */
  inSitu: ImageT[];
};

/**
 * Identity for the subtraction. The same photograph has two different GIDs
 * depending on how it is reached — `MediaImage` through the metafield,
 * `ProductImage` through `product.images` — so fall back to comparing the CDN
 * path, minus the transform query that varies per request.
 */
function imageKeys(img: ImageT): string[] {
  return [img.id, img.url.split('?')[0]];
}

/**
 * Split a product's media into carousel and in-situ sets. Pure; preserves the
 * merchant's ordering within each set.
 */
export function groupProductMedia(product: Product): ProductMediaGroups {
  const images = product.images ?? [];
  const inSitu = product.inSituImages ?? [];

  if (inSitu.length === 0) return {carousel: images, inSitu: []};

  const inSituKeys = new Set(inSitu.flatMap(imageKeys));
  const carousel = images.filter(
    (img) => !imageKeys(img).some((key) => inSituKeys.has(key)),
  );

  // A product page with no main image is a broken page, so the subtraction is
  // never allowed to empty the carousel — if every image was referenced as
  // in-situ, treat that as a mis-authored metafield and keep the carousel.
  if (carousel.length === 0) return {carousel: images, inSitu: []};

  return {carousel, inSitu};
}
