/**
 * Mock data layer for Sisu.
 *
 * Types are intentionally shaped to match a small subset of the Shopify
 * Storefront API. When a real store is connected, the loaders can drop the
 * `USE_MOCK_DATA` branch and feed `storefront.query()` results into the same
 * UI without changing component contracts.
 *
 * Image URLs use Unsplash with `?w=...&auto=format&fit=crop` so they render
 * predictably during design. Replace them with Shopify CDN URLs once the
 * store is populated.
 */

export type Money = {
  amount: string;
  currencyCode: string;
};

export type ImageT = {
  id: string;
  url: string;
  altText: string | null;
  width: number;
  height: number;
};

export type ProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  price: Money;
  compareAtPrice: Money | null;
  selectedOptions: {name: string; value: string}[];
  image: ImageT | null;
};

/**
 * The product spec, sourced from `custom.*` metafields in Shopify:
 * `front_fabric`, `back_fabric`, `trim`, `insert`, `care`.
 */
export type ProductDetails = {
  frontFabric: string | null;
  backFabric: string | null;
  trim: string | null;
  insert: string | null;
  care: string | null;
};

export type Product = {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml?: string;
  vendor: string;
  productType: string;
  tags: string[];
  /** Null when the merchant hasn't set a photograph — the slot renders empty. */
  featuredImage: ImageT | null;
  images: ImageT[];
  /**
   * Curated lifestyle photography from the `custom.in_situ_images` metafield.
   * Undefined when the merchant hasn't set it — see `~/lib/product-media`.
   */
  inSituImages?: ImageT[];
  priceRange: {minVariantPrice: Money; maxVariantPrice: Money};
  variants: {nodes: ProductVariant[]};
  options: {name: string; values: string[]}[];
  details?: ProductDetails;
};

export type Collection = {
  id: string;
  handle: string;
  title: string;
  description: string;
  /** Null when the merchant hasn't set a photograph — the slot renders empty. */
  image: ImageT | null;
  products: {nodes: Product[]};
};

const img = (
  id: string,
  url: string,
  altText: string,
  width = 1600,
  height = 2000,
): ImageT => ({id, url, altText, width, height});

const money = (amount: string, currencyCode = 'GBP'): Money => ({
  amount,
  currencyCode,
});

const baseUnsplash = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&auto=format&fit=crop`;

// Curated nature placeholders — leaves, bark, mist, light. Replace with real
// product photography once available.
export const placeholderImages = {
  heroLinen: baseUnsplash('1448375240586-882707db888b', 1800),
  productMaren: baseUnsplash('1542273917363-3b1817f69a2d', 1200),
  productAleppo: baseUnsplash('1499002238440-d264edd596ec', 1200),
  productSidon: baseUnsplash('1444492417251-9c84a5fa18e0', 1200),
  editorialMending: baseUnsplash('1483921020237-2ff51e8e4b22', 1400),
  bleedAtelier: baseUnsplash('1506905925346-21bda4d32df4', 2000),
  collectionLinen: baseUnsplash('1473773508845-188df298d2d1', 900),
  collectionVelvet: baseUnsplash('1432405972618-c60b0225b8f9', 900),
  collectionWool: baseUnsplash('1518495973542-4542c06a5843', 900),
  collectionArchive: baseUnsplash('1483728642387-6c3bdd6c93e5', 900),
  productExtra1: baseUnsplash('1506784983877-45594efa4cbe', 1200),
  productExtra2: baseUnsplash('1469474968028-56623f02e42e', 1200),
};

export const products: Product[] = [
  {
    id: 'gid://shopify/Product/1',
    handle: 'maren-linen-cushion',
    title: 'Maren Cushion in Bone Linen',
    description:
      'Hand-cut from heavyweight Belgian linen, finished with a slip-stitched closure and feather-down insert. Each piece is sewn to order in our atelier.',
    vendor: 'Sisu',
    productType: 'Cushion',
    tags: ['linen', 'bone'],
    featuredImage: img('img-1', placeholderImages.productMaren, 'Maren cushion in bone linen'),
    images: [
      img('img-1', placeholderImages.productMaren, 'Maren cushion in bone linen'),
      img('img-1b', placeholderImages.productExtra1, 'Maren cushion detail'),
    ],
    priceRange: {
      minVariantPrice: money('148.00'),
      maxVariantPrice: money('168.00'),
    },
    options: [{name: 'Size', values: ['50 × 50 cm', '60 × 40 cm']}],
    variants: {
      nodes: [
        {
          id: 'gid://shopify/ProductVariant/1-1',
          title: '50 × 50 cm',
          availableForSale: true,
          price: money('148.00'),
          compareAtPrice: null,
          selectedOptions: [{name: 'Size', value: '50 × 50 cm'}],
          image: img('img-1', placeholderImages.productMaren, 'Maren cushion'),
        },
      ],
    },
  },
  {
    id: 'gid://shopify/Product/2',
    handle: 'aleppo-velvet-cushion',
    title: 'Aleppo Cushion in Aged Velvet',
    description:
      'A weighty cotton velvet, dyed in the Levant and softened by hand. The Aleppo carries the patina of long use from its first day.',
    vendor: 'Sisu',
    productType: 'Cushion',
    tags: ['velvet', 'rust'],
    featuredImage: img('img-2', placeholderImages.productAleppo, 'Aleppo cushion in aged velvet'),
    images: [
      img('img-2', placeholderImages.productAleppo, 'Aleppo cushion in aged velvet'),
      img('img-2b', placeholderImages.productExtra2, 'Aleppo cushion detail'),
    ],
    priceRange: {
      minVariantPrice: money('186.00'),
      maxVariantPrice: money('186.00'),
    },
    options: [{name: 'Size', values: ['50 × 50 cm']}],
    variants: {
      nodes: [
        {
          id: 'gid://shopify/ProductVariant/2-1',
          title: '50 × 50 cm',
          availableForSale: true,
          price: money('186.00'),
          compareAtPrice: null,
          selectedOptions: [{name: 'Size', value: '50 × 50 cm'}],
          image: img('img-2', placeholderImages.productAleppo, 'Aleppo cushion'),
        },
      ],
    },
  },
  {
    id: 'gid://shopify/Product/3',
    handle: 'sidon-wool-cushion',
    title: 'Sidon Cushion in Undyed Wool',
    description:
      'Spun from the fleece of mountain sheep and woven on a single loom in Tuscany. Sidon is intentionally pale, intentionally slow.',
    vendor: 'Sisu',
    productType: 'Cushion',
    tags: ['wool', 'cream'],
    featuredImage: img('img-3', placeholderImages.productSidon, 'Sidon cushion in undyed wool'),
    images: [
      img('img-3', placeholderImages.productSidon, 'Sidon cushion in undyed wool'),
    ],
    priceRange: {
      minVariantPrice: money('162.00'),
      maxVariantPrice: money('162.00'),
    },
    options: [{name: 'Size', values: ['45 × 45 cm']}],
    variants: {
      nodes: [
        {
          id: 'gid://shopify/ProductVariant/3-1',
          title: '45 × 45 cm',
          availableForSale: true,
          price: money('162.00'),
          compareAtPrice: null,
          selectedOptions: [{name: 'Size', value: '45 × 45 cm'}],
          image: img('img-3', placeholderImages.productSidon, 'Sidon cushion'),
        },
      ],
    },
  },
];

export const collections: Collection[] = [
  {
    id: 'gid://shopify/Collection/1',
    handle: 'linen',
    title: 'Linen',
    description:
      'Heavyweight Belgian linen, washed until soft. Pieces in this room are cut for everyday rest.',
    image: img('col-linen', placeholderImages.collectionLinen, 'Linen collection', 1200, 1500),
    products: {nodes: [products[0]]},
  },
  {
    id: 'gid://shopify/Collection/2',
    handle: 'velvet',
    title: 'Velvet',
    description:
      'Cotton velvets, dyed in small lots. Each piece deepens with handling.',
    image: img('col-velvet', placeholderImages.collectionVelvet, 'Velvet collection', 1200, 1500),
    products: {nodes: [products[1]]},
  },
  {
    id: 'gid://shopify/Collection/3',
    handle: 'wool',
    title: 'Wool',
    description: 'Undyed mountain wool, woven on a single loom in Tuscany.',
    image: img('col-wool', placeholderImages.collectionWool, 'Wool collection', 1200, 1500),
    products: {nodes: [products[2]]},
  },
  {
    id: 'gid://shopify/Collection/4',
    handle: 'archive',
    title: 'Archive',
    description: 'Past commissions and small one-of-a-kind makes.',
    image: img('col-archive', placeholderImages.collectionArchive, 'Archive collection', 1200, 1500),
    products: {nodes: products.slice(0, 2)},
  },
];

export const featuredCollection: Collection = {
  id: 'gid://shopify/Collection/featured',
  handle: 'the-atelier-collection',
  title: 'The Atelier Collection',
  description:
    'Three pieces, made slowly. Cut, sewn and hand-finished in small batches in Amsterdam.',
  image: img(
    'col-featured',
    placeholderImages.heroLinen,
    'The Atelier collection',
    1600,
    1800,
  ),
  products: {nodes: products},
};

export function getProductByHandle(handle: string): Product | undefined {
  return products.find((p) => p.handle === handle);
}

export function getCollectionByHandle(handle: string): Collection | undefined {
  if (handle === featuredCollection.handle) return featuredCollection;
  return collections.find((c) => c.handle === handle);
}
