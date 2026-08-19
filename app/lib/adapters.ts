/**
 * Adapters: map raw Storefront API results into the clean view-model types in
 * `~/lib/mock-data`. Keeping this mapping in one place means components stay
 * decoupled from the Storefront API shape, and the mock + real data paths
 * converge on a single contract.
 */
import type {
  ProductFragment,
  CollectionCardFragment,
} from 'storefrontapi.generated';
import type {
  ImageT,
  Money,
  Product,
  ProductVariant,
  Collection,
} from '~/lib/mock-data';

/** Shown when a Shopify object has no image set. */
const FALLBACK_IMAGE: ImageT = {
  id: 'fallback',
  url: 'https://cdn.shopify.com/static/images/examples/img-placeholder-1024x1024.png',
  altText: null,
  width: 1024,
  height: 1024,
};

type ApiImage = ProductFragment['featuredImage'];
type ApiMoney = ProductFragment['priceRange']['minVariantPrice'];

function toImage(img: ApiImage): ImageT {
  if (!img) return FALLBACK_IMAGE;
  return {
    id: img.id ?? img.url,
    url: img.url,
    altText: img.altText ?? null,
    width: img.width ?? 0,
    height: img.height ?? 0,
  };
}

function toMoney(money: ApiMoney): Money {
  return {amount: money.amount, currencyCode: money.currencyCode};
}

function toVariant(v: ProductFragment['variants']['nodes'][number]): ProductVariant {
  return {
    id: v.id,
    title: v.title,
    availableForSale: v.availableForSale,
    price: toMoney(v.price),
    compareAtPrice: v.compareAtPrice ? toMoney(v.compareAtPrice) : null,
    selectedOptions: v.selectedOptions.map((o) => ({name: o.name, value: o.value})),
    image: v.image ? toImage(v.image) : null,
  };
}

export function toProduct(p: ProductFragment): Product {
  // metafields() returns entries aligned to the requested identifiers; map by key.
  const mf = new Map(
    (p.metafields ?? [])
      .filter((m): m is NonNullable<typeof m> => Boolean(m))
      .map((m) => [m.key, m.value]),
  );

  return {
    id: p.id,
    handle: p.handle,
    title: p.title,
    description: p.description,
    descriptionHtml: p.descriptionHtml,
    vendor: p.vendor,
    productType: p.productType,
    tags: p.tags,
    featuredImage: toImage(p.featuredImage),
    images: p.images.nodes.map(toImage),
    priceRange: {
      minVariantPrice: toMoney(p.priceRange.minVariantPrice),
      maxVariantPrice: toMoney(p.priceRange.maxVariantPrice),
    },
    options: p.options.map((o) => ({
      name: o.name,
      values: o.optionValues.map((v) => v.name),
    })),
    variants: {nodes: p.variants.nodes.map(toVariant)},
    details: {
      frontFabric: mf.get('front_fabric') ?? null,
      backFabric: mf.get('back_fabric') ?? null,
      trim: mf.get('trim') ?? null,
      insert: mf.get('insert') ?? null,
      care: mf.get('care') ?? null,
    },
  };
}

/** Collection list card — no products needed. */
export function toCollectionCard(c: CollectionCardFragment): Collection {
  return {
    id: c.id,
    handle: c.handle,
    title: c.title,
    description: c.description,
    image: toImage(c.image),
    products: {nodes: []},
  };
}

/** Collection with its products (detail page + homepage featured). */
export function toCollection(
  c: CollectionCardFragment & {products: {nodes: ProductFragment[]}},
): Collection {
  return {
    ...toCollectionCard(c),
    products: {nodes: c.products.nodes.map(toProduct)},
  };
}
