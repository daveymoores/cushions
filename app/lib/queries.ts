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
    descriptionHtml
    vendor
    productType
    tags
    metafields(
      identifiers: [
        {namespace: "custom", key: "front_fabric"}
        {namespace: "custom", key: "back_fabric"}
        {namespace: "custom", key: "trim"}
        {namespace: "custom", key: "insert"}
        {namespace: "custom", key: "care"}
        {namespace: "custom", key: "in_situ_images"}
      ]
    ) {
      key
      value
      # Only custom.in_situ_images (list.file_reference) resolves references;
      # the text metafields above return null here. See app/lib/product-media.ts.
      references(first: 10) {
        nodes {
          ... on MediaImage {
            image {
              ...Image
            }
          }
        }
      }
    }
    featuredImage {
      ...Image
    }
    images(first: 20) {
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

/**
 * Site/editorial content from a singleton `homepage` metaobject
 * (Settings → Custom data → Metaobjects). See app/lib/content.ts for fields.
 */
export const SITE_CONTENT_QUERY = `#graphql
  query SiteContent {
    metaobjects(type: "homepage", first: 1) {
      nodes {
        handle
        fields {
          key
          value
          reference {
            ... on MediaImage {
              image {
                ...Image
              }
            }
          }
        }
      }
    }
  }
  ${IMAGE_FRAGMENT}
` as const;

/** Product + collection handles for the sitemap. */
export const SITEMAP_QUERY = `#graphql
  query Sitemap($first: Int!, $blog: String!) {
    products(first: $first) {
      nodes {
        handle
        updatedAt
      }
    }
    collections(first: $first) {
      nodes {
        handle
        updatedAt
      }
    }
    pages(first: $first) {
      nodes {
        handle
        updatedAt
      }
    }
    blog(handle: $blog) {
      articles(first: $first, sortKey: PUBLISHED_AT, reverse: true) {
        nodes {
          handle
          publishedAt
        }
      }
    }
  }
` as const;

/** Lightweight collection list for site navigation (header + footer). */
export const NAV_COLLECTIONS_QUERY = `#graphql
  query NavCollections($first: Int!) {
    collections(first: $first) {
      nodes {
        id
        handle
        title
      }
    }
  }
` as const;

/**
 * A merchant-editable menu, two levels deep (Online Store → Navigation).
 *
 * Shopify menus nest three levels; only two are requested because that is all
 * either nav surface can render — the header uses the top row and ignores
 * children, the footer uses top-level items as column headings and their
 * children as the column's links. See `~/lib/nav`.
 */
const NAV_MENU_FRAGMENT = `#graphql
  fragment NavMenu on Menu {
    id
    items {
      id
      title
      type
      url
      items {
        id
        title
        type
        url
      }
    }
  }
` as const;

/**
 * Every merchant-editable menu in a single round trip — the header's
 * `main-menu`, the footer's `footer` and the footer's social icons, `social`
 * (see `~/lib/social`) — aliased rather than queried separately so one nav read
 * costs one request.
 *
 * `items.url` is absolute on whichever domain the shop is published under, so
 * `shop.primaryDomain` is fetched alongside them — `~/lib/nav` needs the set of
 * hosts that count as "this site" to re-base each item onto an app path.
 */
export const MENUS_QUERY = `#graphql
  query Menus(
    $mainHandle: String!
    $footerHandle: String!
    $socialHandle: String!
  ) {
    main: menu(handle: $mainHandle) {
      ...NavMenu
    }
    footer: menu(handle: $footerHandle) {
      ...NavMenu
    }
    social: menu(handle: $socialHandle) {
      ...NavMenu
    }
    shop {
      primaryDomain {
        url
      }
    }
  }
  ${NAV_MENU_FRAGMENT}
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

/**
 * A Shopify "Page" (Online Store → Pages) — for editorial/static content like
 * the Atelier or an About page. `body` is rich-text HTML authored in admin.
 */
export const PAGE_QUERY = `#graphql
  query Page($handle: String!) {
    page(handle: $handle) {
      id
      title
      body
      seo {
        title
        description
      }
    }
  }
` as const;

const POLICY_FRAGMENT = `#graphql
  fragment Policy on ShopPolicy {
    id
    handle
    title
    body
  }
` as const;

/**
 * One store policy (Settings → Policies). The Storefront API exposes each
 * policy as its own `shop` field, and a field name can't be a variable, so
 * every field is listed and the caller switches on exactly one with its
 * boolean — the others are skipped rather than fetched and discarded. `body`
 * is rich-text HTML authored in admin. See `routes/policies.$handle.tsx`.
 */
export const POLICY_QUERY = `#graphql
  query Policy(
    $privacyPolicy: Boolean!
    $refundPolicy: Boolean!
    $shippingPolicy: Boolean!
    $termsOfService: Boolean!
    $termsOfSale: Boolean!
    $subscriptionPolicy: Boolean!
    $contactInformation: Boolean!
  ) {
    shop {
      privacyPolicy @include(if: $privacyPolicy) {
        ...Policy
      }
      refundPolicy @include(if: $refundPolicy) {
        ...Policy
      }
      shippingPolicy @include(if: $shippingPolicy) {
        ...Policy
      }
      termsOfService @include(if: $termsOfService) {
        ...Policy
      }
      termsOfSale @include(if: $termsOfSale) {
        ...Policy
      }
      # A different type (ShopPolicyWithDefault) with the same fields, so the
      # ShopPolicy fragment can't be spread here.
      subscriptionPolicy @include(if: $subscriptionPolicy) {
        id
        handle
        title
        body
      }
      contactInformation @include(if: $contactInformation) {
        ...Policy
      }
    }
  }
  ${POLICY_FRAGMENT}
` as const;

/** Blog index — the list of articles in a Shopify blog (e.g. handle "journal"). */
export const BLOG_QUERY = `#graphql
  query Blog($handle: String!, $first: Int!) {
    blog(handle: $handle) {
      title
      articles(first: $first, sortKey: PUBLISHED_AT, reverse: true) {
        nodes {
          id
          handle
          title
          excerpt
          publishedAt
          author: authorV2 {
            name
          }
          image {
            ...Image
          }
        }
      }
    }
  }
  ${IMAGE_FRAGMENT}
` as const;

/** A single blog article. */
export const ARTICLE_QUERY = `#graphql
  query Article($blog: String!, $handle: String!) {
    blog(handle: $blog) {
      articleByHandle(handle: $handle) {
        id
        title
        contentHtml
        publishedAt
        author: authorV2 {
          name
        }
        image {
          ...Image
        }
        seo {
          title
          description
        }
      }
    }
  }
  ${IMAGE_FRAGMENT}
` as const;

/**
 * Metaobjects of a given type — for custom, repeatable content defined under
 * Settings → Custom data → Metaobjects. Fields come back as generic key/value
 * pairs; `reference` resolves file/image fields. See app/lib/metaobject.ts.
 */
export const METAOBJECTS_QUERY = `#graphql
  query Metaobjects($type: String!, $first: Int!) {
    metaobjects(type: $type, first: $first) {
      nodes {
        id
        handle
        fields {
          key
          value
          reference {
            ... on MediaImage {
              image {
                ...Image
              }
            }
          }
        }
      }
    }
  }
  ${IMAGE_FRAGMENT}
` as const;
