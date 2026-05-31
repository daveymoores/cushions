/**
 * Storefront API fragments + queries for Sisu.
 *
 * These select exactly the fields the UI needs. The raw results are mapped into
 * the clean view-model types in `~/lib/mock-data` by the adapters in
 * `~/lib/adapters`, so components never depend on the Storefront API shape.
 */

const MONEY_FRAGMENT = `#graphql
  fragment Money on MoneyV2 {
    amount
    currencyCode
  }
` as const;

const IMAGE_FRAGMENT = `#graphql
  fragment Image on Image {
    id
    url
    altText
    width
    height
  }
` as const;

/**
 * The full product shape used by both grid cards and the product detail page.
 * Slightly heavier than a card needs, but keeps a single source of truth.
 */
export const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    handle
    title
    description
    vendor
    productType
    tags
    featuredImage {
      ...Image
    }
    images(first: 8) {
      nodes {
        ...Image
      }
    }
    priceRange {
      minVariantPrice {
        ...Money
      }
      maxVariantPrice {
        ...Money
      }
    }
    options {
      name
      optionValues {
        name
      }
    }
    variants(first: 50) {
      nodes {
        id
        title
        availableForSale
        price {
          ...Money
        }
        compareAtPrice {
          ...Money
        }
        selectedOptions {
          name
          value
        }
        image {
          ...Image
        }
      }
    }
  }
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
` as const;

export const COLLECTION_CARD_FRAGMENT = `#graphql
  fragment CollectionCard on Collection {
    id
    handle
    title
    description
    image {
      ...Image
    }
  }
  ${IMAGE_FRAGMENT}
` as const;

/** Homepage + collection detail: a collection with its products. */
export const COLLECTION_QUERY = `#graphql
  query Collection($handle: String!, $first: Int!) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      image {
        ...Image
      }
      products(first: $first) {
        nodes {
          ...Product
        }
      }
    }
  }
  ${PRODUCT_FRAGMENT}
` as const;

/** Homepage "browse by collection" strip + collections index. */
export const COLLECTIONS_QUERY = `#graphql
  query Collections($first: Int!) {
    collections(first: $first) {
      nodes {
        ...CollectionCard
      }
    }
  }
  ${COLLECTION_CARD_FRAGMENT}
` as const;

/** Product detail page. */
export const PRODUCT_QUERY = `#graphql
  query ProductByHandle($handle: String!) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
` as const;
