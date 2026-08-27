/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
import type * as StorefrontAPI from '@shopify/hydrogen/storefront-api-types';

export type MoneyFragment = Pick<
  StorefrontAPI.MoneyV2,
  'amount' | 'currencyCode'
>;

export type ImageFragment = Pick<
  StorefrontAPI.Image,
  'id' | 'url' | 'altText' | 'width' | 'height'
>;

export type ProductFragment = Pick<
  StorefrontAPI.Product,
  | 'id'
  | 'handle'
  | 'title'
  | 'description'
  | 'descriptionHtml'
  | 'vendor'
  | 'productType'
  | 'tags'
> & {
  metafields: Array<
    StorefrontAPI.Maybe<
      Pick<StorefrontAPI.Metafield, 'key' | 'value'> & {
        references?: StorefrontAPI.Maybe<{
          nodes: Array<{
            image?: StorefrontAPI.Maybe<
              Pick<
                StorefrontAPI.Image,
                'id' | 'url' | 'altText' | 'width' | 'height'
              >
            >;
          }>;
        }>;
      }
    >
  >;
  featuredImage?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Image, 'id' | 'url' | 'altText' | 'width' | 'height'>
  >;
  images: {
    nodes: Array<
      Pick<StorefrontAPI.Image, 'id' | 'url' | 'altText' | 'width' | 'height'>
    >;
  };
  priceRange: {
    minVariantPrice: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
    maxVariantPrice: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
  };
  options: Array<
    Pick<StorefrontAPI.ProductOption, 'name'> & {
      optionValues: Array<Pick<StorefrontAPI.ProductOptionValue, 'name'>>;
    }
  >;
  variants: {
    nodes: Array<
      Pick<
        StorefrontAPI.ProductVariant,
        'id' | 'title' | 'availableForSale'
      > & {
        price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
        compareAtPrice?: StorefrontAPI.Maybe<
          Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
        >;
        selectedOptions: Array<
          Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>
        >;
        image?: StorefrontAPI.Maybe<
          Pick<
            StorefrontAPI.Image,
            'id' | 'url' | 'altText' | 'width' | 'height'
          >
        >;
      }
    >;
  };
};

export type CollectionCardFragment = Pick<
  StorefrontAPI.Collection,
  'id' | 'handle' | 'title' | 'description'
> & {
  image?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Image, 'id' | 'url' | 'altText' | 'width' | 'height'>
  >;
};

export type CollectionQueryVariables = StorefrontAPI.Exact<{
  handle: StorefrontAPI.Scalars['String']['input'];
  first: StorefrontAPI.Scalars['Int']['input'];
}>;

export type CollectionQuery = {
  collection?: StorefrontAPI.Maybe<
    Pick<
      StorefrontAPI.Collection,
      'id' | 'handle' | 'title' | 'description'
    > & {
      image?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.Image, 'id' | 'url' | 'altText' | 'width' | 'height'>
      >;
      products: {
        nodes: Array<
          Pick<
            StorefrontAPI.Product,
            | 'id'
            | 'handle'
            | 'title'
            | 'description'
            | 'descriptionHtml'
            | 'vendor'
            | 'productType'
            | 'tags'
          > & {
            metafields: Array<
              StorefrontAPI.Maybe<
                Pick<StorefrontAPI.Metafield, 'key' | 'value'> & {
                  references?: StorefrontAPI.Maybe<{
                    nodes: Array<{
                      image?: StorefrontAPI.Maybe<
                        Pick<
                          StorefrontAPI.Image,
                          'id' | 'url' | 'altText' | 'width' | 'height'
                        >
                      >;
                    }>;
                  }>;
                }
              >
            >;
            featuredImage?: StorefrontAPI.Maybe<
              Pick<
                StorefrontAPI.Image,
                'id' | 'url' | 'altText' | 'width' | 'height'
              >
            >;
            images: {
              nodes: Array<
                Pick<
                  StorefrontAPI.Image,
                  'id' | 'url' | 'altText' | 'width' | 'height'
                >
              >;
            };
            priceRange: {
              minVariantPrice: Pick<
                StorefrontAPI.MoneyV2,
                'amount' | 'currencyCode'
              >;
              maxVariantPrice: Pick<
                StorefrontAPI.MoneyV2,
                'amount' | 'currencyCode'
              >;
            };
            options: Array<
              Pick<StorefrontAPI.ProductOption, 'name'> & {
                optionValues: Array<
                  Pick<StorefrontAPI.ProductOptionValue, 'name'>
                >;
              }
            >;
            variants: {
              nodes: Array<
                Pick<
                  StorefrontAPI.ProductVariant,
                  'id' | 'title' | 'availableForSale'
                > & {
                  price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
                  compareAtPrice?: StorefrontAPI.Maybe<
                    Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
                  >;
                  selectedOptions: Array<
                    Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>
                  >;
                  image?: StorefrontAPI.Maybe<
                    Pick<
                      StorefrontAPI.Image,
                      'id' | 'url' | 'altText' | 'width' | 'height'
                    >
                  >;
                }
              >;
            };
          }
        >;
      };
    }
  >;
};

export type CollectionsQueryVariables = StorefrontAPI.Exact<{
  first: StorefrontAPI.Scalars['Int']['input'];
}>;

export type CollectionsQuery = {
  collections: {
    nodes: Array<
      Pick<
        StorefrontAPI.Collection,
        'id' | 'handle' | 'title' | 'description'
      > & {
        image?: StorefrontAPI.Maybe<
          Pick<
            StorefrontAPI.Image,
            'id' | 'url' | 'altText' | 'width' | 'height'
          >
        >;
      }
    >;
  };
};

export type SiteContentQueryVariables = StorefrontAPI.Exact<{
  [key: string]: never;
}>;

export type SiteContentQuery = {
  metaobjects: {
    nodes: Array<
      Pick<StorefrontAPI.Metaobject, 'handle'> & {
        fields: Array<
          Pick<StorefrontAPI.MetaobjectField, 'key' | 'value'> & {
            reference?: StorefrontAPI.Maybe<{
              image?: StorefrontAPI.Maybe<
                Pick<
                  StorefrontAPI.Image,
                  'id' | 'url' | 'altText' | 'width' | 'height'
                >
              >;
            }>;
          }
        >;
      }
    >;
  };
};

export type SitemapQueryVariables = StorefrontAPI.Exact<{
  first: StorefrontAPI.Scalars['Int']['input'];
  blog: StorefrontAPI.Scalars['String']['input'];
}>;

export type SitemapQuery = {
  products: {nodes: Array<Pick<StorefrontAPI.Product, 'handle' | 'updatedAt'>>};
  collections: {
    nodes: Array<Pick<StorefrontAPI.Collection, 'handle' | 'updatedAt'>>;
  };
  pages: {nodes: Array<Pick<StorefrontAPI.Page, 'handle' | 'updatedAt'>>};
  blog?: StorefrontAPI.Maybe<{
    articles: {
      nodes: Array<Pick<StorefrontAPI.Article, 'handle' | 'publishedAt'>>;
    };
  }>;
};

export type NavCollectionsQueryVariables = StorefrontAPI.Exact<{
  first: StorefrontAPI.Scalars['Int']['input'];
}>;

export type NavCollectionsQuery = {
  collections: {
    nodes: Array<Pick<StorefrontAPI.Collection, 'id' | 'handle' | 'title'>>;
  };
};

export type ProductByHandleQueryVariables = StorefrontAPI.Exact<{
  handle: StorefrontAPI.Scalars['String']['input'];
}>;

export type ProductByHandleQuery = {
  product?: StorefrontAPI.Maybe<
    Pick<
      StorefrontAPI.Product,
      | 'id'
      | 'handle'
      | 'title'
      | 'description'
      | 'descriptionHtml'
      | 'vendor'
      | 'productType'
      | 'tags'
    > & {
      metafields: Array<
        StorefrontAPI.Maybe<
          Pick<StorefrontAPI.Metafield, 'key' | 'value'> & {
            references?: StorefrontAPI.Maybe<{
              nodes: Array<{
                image?: StorefrontAPI.Maybe<
                  Pick<
                    StorefrontAPI.Image,
                    'id' | 'url' | 'altText' | 'width' | 'height'
                  >
                >;
              }>;
            }>;
          }
        >
      >;
      featuredImage?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.Image, 'id' | 'url' | 'altText' | 'width' | 'height'>
      >;
      images: {
        nodes: Array<
          Pick<
            StorefrontAPI.Image,
            'id' | 'url' | 'altText' | 'width' | 'height'
          >
        >;
      };
      priceRange: {
        minVariantPrice: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
        maxVariantPrice: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
      };
      options: Array<
        Pick<StorefrontAPI.ProductOption, 'name'> & {
          optionValues: Array<Pick<StorefrontAPI.ProductOptionValue, 'name'>>;
        }
      >;
      variants: {
        nodes: Array<
          Pick<
            StorefrontAPI.ProductVariant,
            'id' | 'title' | 'availableForSale'
          > & {
            price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
            compareAtPrice?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
            >;
            selectedOptions: Array<
              Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>
            >;
            image?: StorefrontAPI.Maybe<
              Pick<
                StorefrontAPI.Image,
                'id' | 'url' | 'altText' | 'width' | 'height'
              >
            >;
          }
        >;
      };
    }
  >;
};

export type PageQueryVariables = StorefrontAPI.Exact<{
  handle: StorefrontAPI.Scalars['String']['input'];
}>;

export type PageQuery = {
  page?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Page, 'id' | 'title' | 'body'> & {
      seo?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.Seo, 'title' | 'description'>
      >;
    }
  >;
};

export type BlogQueryVariables = StorefrontAPI.Exact<{
  handle: StorefrontAPI.Scalars['String']['input'];
  first: StorefrontAPI.Scalars['Int']['input'];
}>;

export type BlogQuery = {
  blog?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Blog, 'title'> & {
      articles: {
        nodes: Array<
          Pick<
            StorefrontAPI.Article,
            'id' | 'handle' | 'title' | 'excerpt' | 'publishedAt'
          > & {
            author?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.ArticleAuthor, 'name'>
            >;
            image?: StorefrontAPI.Maybe<
              Pick<
                StorefrontAPI.Image,
                'id' | 'url' | 'altText' | 'width' | 'height'
              >
            >;
          }
        >;
      };
    }
  >;
};

export type ArticleQueryVariables = StorefrontAPI.Exact<{
  blog: StorefrontAPI.Scalars['String']['input'];
  handle: StorefrontAPI.Scalars['String']['input'];
}>;

export type ArticleQuery = {
  blog?: StorefrontAPI.Maybe<{
    articleByHandle?: StorefrontAPI.Maybe<
      Pick<
        StorefrontAPI.Article,
        'id' | 'title' | 'contentHtml' | 'publishedAt'
      > & {
        author?: StorefrontAPI.Maybe<Pick<StorefrontAPI.ArticleAuthor, 'name'>>;
        image?: StorefrontAPI.Maybe<
          Pick<
            StorefrontAPI.Image,
            'id' | 'url' | 'altText' | 'width' | 'height'
          >
        >;
        seo?: StorefrontAPI.Maybe<
          Pick<StorefrontAPI.Seo, 'title' | 'description'>
        >;
      }
    >;
  }>;
};

export type MetaobjectsQueryVariables = StorefrontAPI.Exact<{
  type: StorefrontAPI.Scalars['String']['input'];
  first: StorefrontAPI.Scalars['Int']['input'];
}>;

export type MetaobjectsQuery = {
  metaobjects: {
    nodes: Array<
      Pick<StorefrontAPI.Metaobject, 'id' | 'handle'> & {
        fields: Array<
          Pick<StorefrontAPI.MetaobjectField, 'key' | 'value'> & {
            reference?: StorefrontAPI.Maybe<{
              image?: StorefrontAPI.Maybe<
                Pick<
                  StorefrontAPI.Image,
                  'id' | 'url' | 'altText' | 'width' | 'height'
                >
              >;
            }>;
          }
        >;
      }
    >;
  };
};

interface GeneratedQueryTypes {
  '#graphql\n  query Collection($handle: String!, $first: Int!) {\n    collection(handle: $handle) {\n      id\n      handle\n      title\n      description\n      image {\n        ...Image\n      }\n      products(first: $first) {\n        nodes {\n          ...Product\n        }\n      }\n    }\n  }\n  #graphql\n  fragment Product on Product {\n    id\n    handle\n    title\n    description\n    descriptionHtml\n    vendor\n    productType\n    tags\n    metafields(\n      identifiers: [\n        {namespace: "custom", key: "front_fabric"}\n        {namespace: "custom", key: "back_fabric"}\n        {namespace: "custom", key: "trim"}\n        {namespace: "custom", key: "insert"}\n        {namespace: "custom", key: "care"}\n        {namespace: "custom", key: "in_situ_images"}\n      ]\n    ) {\n      key\n      value\n      # Only custom.in_situ_images (list.file_reference) resolves references;\n      # the text metafields above return null here. See app/lib/product-media.ts.\n      references(first: 10) {\n        nodes {\n          ... on MediaImage {\n            image {\n              ...Image\n            }\n          }\n        }\n      }\n    }\n    featuredImage {\n      ...Image\n    }\n    images(first: 20) {\n      nodes {\n        ...Image\n      }\n    }\n    priceRange {\n      minVariantPrice {\n        ...Money\n      }\n      maxVariantPrice {\n        ...Money\n      }\n    }\n    options {\n      name\n      optionValues {\n        name\n      }\n    }\n    variants(first: 50) {\n      nodes {\n        id\n        title\n        availableForSale\n        price {\n          ...Money\n        }\n        compareAtPrice {\n          ...Money\n        }\n        selectedOptions {\n          name\n          value\n        }\n        image {\n          ...Image\n        }\n      }\n    }\n  }\n  #graphql\n  fragment Image on Image {\n    id\n    url\n    altText\n    width\n    height\n  }\n\n  #graphql\n  fragment Money on MoneyV2 {\n    amount\n    currencyCode\n  }\n\n\n': {
    return: CollectionQuery;
    variables: CollectionQueryVariables;
  };
  '#graphql\n  query Collections($first: Int!) {\n    collections(first: $first) {\n      nodes {\n        ...CollectionCard\n      }\n    }\n  }\n  #graphql\n  fragment CollectionCard on Collection {\n    id\n    handle\n    title\n    description\n    image {\n      ...Image\n    }\n  }\n  #graphql\n  fragment Image on Image {\n    id\n    url\n    altText\n    width\n    height\n  }\n\n\n': {
    return: CollectionsQuery;
    variables: CollectionsQueryVariables;
  };
  '#graphql\n  query SiteContent {\n    metaobjects(type: "homepage", first: 1) {\n      nodes {\n        handle\n        fields {\n          key\n          value\n          reference {\n            ... on MediaImage {\n              image {\n                ...Image\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n  #graphql\n  fragment Image on Image {\n    id\n    url\n    altText\n    width\n    height\n  }\n\n': {
    return: SiteContentQuery;
    variables: SiteContentQueryVariables;
  };
  '#graphql\n  query Sitemap($first: Int!, $blog: String!) {\n    products(first: $first) {\n      nodes {\n        handle\n        updatedAt\n      }\n    }\n    collections(first: $first) {\n      nodes {\n        handle\n        updatedAt\n      }\n    }\n    pages(first: $first) {\n      nodes {\n        handle\n        updatedAt\n      }\n    }\n    blog(handle: $blog) {\n      articles(first: $first, sortKey: PUBLISHED_AT, reverse: true) {\n        nodes {\n          handle\n          publishedAt\n        }\n      }\n    }\n  }\n': {
    return: SitemapQuery;
    variables: SitemapQueryVariables;
  };
  '#graphql\n  query NavCollections($first: Int!) {\n    collections(first: $first) {\n      nodes {\n        id\n        handle\n        title\n      }\n    }\n  }\n': {
    return: NavCollectionsQuery;
    variables: NavCollectionsQueryVariables;
  };
  '#graphql\n  query ProductByHandle($handle: String!) {\n    product(handle: $handle) {\n      ...Product\n    }\n  }\n  #graphql\n  fragment Product on Product {\n    id\n    handle\n    title\n    description\n    descriptionHtml\n    vendor\n    productType\n    tags\n    metafields(\n      identifiers: [\n        {namespace: "custom", key: "front_fabric"}\n        {namespace: "custom", key: "back_fabric"}\n        {namespace: "custom", key: "trim"}\n        {namespace: "custom", key: "insert"}\n        {namespace: "custom", key: "care"}\n        {namespace: "custom", key: "in_situ_images"}\n      ]\n    ) {\n      key\n      value\n      # Only custom.in_situ_images (list.file_reference) resolves references;\n      # the text metafields above return null here. See app/lib/product-media.ts.\n      references(first: 10) {\n        nodes {\n          ... on MediaImage {\n            image {\n              ...Image\n            }\n          }\n        }\n      }\n    }\n    featuredImage {\n      ...Image\n    }\n    images(first: 20) {\n      nodes {\n        ...Image\n      }\n    }\n    priceRange {\n      minVariantPrice {\n        ...Money\n      }\n      maxVariantPrice {\n        ...Money\n      }\n    }\n    options {\n      name\n      optionValues {\n        name\n      }\n    }\n    variants(first: 50) {\n      nodes {\n        id\n        title\n        availableForSale\n        price {\n          ...Money\n        }\n        compareAtPrice {\n          ...Money\n        }\n        selectedOptions {\n          name\n          value\n        }\n        image {\n          ...Image\n        }\n      }\n    }\n  }\n  #graphql\n  fragment Image on Image {\n    id\n    url\n    altText\n    width\n    height\n  }\n\n  #graphql\n  fragment Money on MoneyV2 {\n    amount\n    currencyCode\n  }\n\n\n': {
    return: ProductByHandleQuery;
    variables: ProductByHandleQueryVariables;
  };
  '#graphql\n  query Page($handle: String!) {\n    page(handle: $handle) {\n      id\n      title\n      body\n      seo {\n        title\n        description\n      }\n    }\n  }\n': {
    return: PageQuery;
    variables: PageQueryVariables;
  };
  '#graphql\n  query Blog($handle: String!, $first: Int!) {\n    blog(handle: $handle) {\n      title\n      articles(first: $first, sortKey: PUBLISHED_AT, reverse: true) {\n        nodes {\n          id\n          handle\n          title\n          excerpt\n          publishedAt\n          author: authorV2 {\n            name\n          }\n          image {\n            ...Image\n          }\n        }\n      }\n    }\n  }\n  #graphql\n  fragment Image on Image {\n    id\n    url\n    altText\n    width\n    height\n  }\n\n': {
    return: BlogQuery;
    variables: BlogQueryVariables;
  };
  '#graphql\n  query Article($blog: String!, $handle: String!) {\n    blog(handle: $blog) {\n      articleByHandle(handle: $handle) {\n        id\n        title\n        contentHtml\n        publishedAt\n        author: authorV2 {\n          name\n        }\n        image {\n          ...Image\n        }\n        seo {\n          title\n          description\n        }\n      }\n    }\n  }\n  #graphql\n  fragment Image on Image {\n    id\n    url\n    altText\n    width\n    height\n  }\n\n': {
    return: ArticleQuery;
    variables: ArticleQueryVariables;
  };
  '#graphql\n  query Metaobjects($type: String!, $first: Int!) {\n    metaobjects(type: $type, first: $first) {\n      nodes {\n        id\n        handle\n        fields {\n          key\n          value\n          reference {\n            ... on MediaImage {\n              image {\n                ...Image\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n  #graphql\n  fragment Image on Image {\n    id\n    url\n    altText\n    width\n    height\n  }\n\n': {
    return: MetaobjectsQuery;
    variables: MetaobjectsQueryVariables;
  };
}

interface GeneratedMutationTypes {}

declare module '@shopify/hydrogen' {
  interface StorefrontQueries extends GeneratedQueryTypes {}
  interface StorefrontMutations extends GeneratedMutationTypes {}
}
