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
  'id' | 'handle' | 'title' | 'description' | 'vendor' | 'productType' | 'tags'
> & {
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
            | 'vendor'
            | 'productType'
            | 'tags'
          > & {
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
      | 'vendor'
      | 'productType'
      | 'tags'
    > & {
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

interface GeneratedQueryTypes {
  '#graphql\n  query Collection($handle: String!, $first: Int!) {\n    collection(handle: $handle) {\n      id\n      handle\n      title\n      description\n      image {\n        ...Image\n      }\n      products(first: $first) {\n        nodes {\n          ...Product\n        }\n      }\n    }\n  }\n  #graphql\n  fragment Product on Product {\n    id\n    handle\n    title\n    description\n    vendor\n    productType\n    tags\n    featuredImage {\n      ...Image\n    }\n    images(first: 8) {\n      nodes {\n        ...Image\n      }\n    }\n    priceRange {\n      minVariantPrice {\n        ...Money\n      }\n      maxVariantPrice {\n        ...Money\n      }\n    }\n    options {\n      name\n      optionValues {\n        name\n      }\n    }\n    variants(first: 50) {\n      nodes {\n        id\n        title\n        availableForSale\n        price {\n          ...Money\n        }\n        compareAtPrice {\n          ...Money\n        }\n        selectedOptions {\n          name\n          value\n        }\n        image {\n          ...Image\n        }\n      }\n    }\n  }\n  #graphql\n  fragment Image on Image {\n    id\n    url\n    altText\n    width\n    height\n  }\n\n  #graphql\n  fragment Money on MoneyV2 {\n    amount\n    currencyCode\n  }\n\n\n': {
    return: CollectionQuery;
    variables: CollectionQueryVariables;
  };
  '#graphql\n  query Collections($first: Int!) {\n    collections(first: $first) {\n      nodes {\n        ...CollectionCard\n      }\n    }\n  }\n  #graphql\n  fragment CollectionCard on Collection {\n    id\n    handle\n    title\n    description\n    image {\n      ...Image\n    }\n  }\n  #graphql\n  fragment Image on Image {\n    id\n    url\n    altText\n    width\n    height\n  }\n\n\n': {
    return: CollectionsQuery;
    variables: CollectionsQueryVariables;
  };
  '#graphql\n  query ProductByHandle($handle: String!) {\n    product(handle: $handle) {\n      ...Product\n    }\n  }\n  #graphql\n  fragment Product on Product {\n    id\n    handle\n    title\n    description\n    vendor\n    productType\n    tags\n    featuredImage {\n      ...Image\n    }\n    images(first: 8) {\n      nodes {\n        ...Image\n      }\n    }\n    priceRange {\n      minVariantPrice {\n        ...Money\n      }\n      maxVariantPrice {\n        ...Money\n      }\n    }\n    options {\n      name\n      optionValues {\n        name\n      }\n    }\n    variants(first: 50) {\n      nodes {\n        id\n        title\n        availableForSale\n        price {\n          ...Money\n        }\n        compareAtPrice {\n          ...Money\n        }\n        selectedOptions {\n          name\n          value\n        }\n        image {\n          ...Image\n        }\n      }\n    }\n  }\n  #graphql\n  fragment Image on Image {\n    id\n    url\n    altText\n    width\n    height\n  }\n\n  #graphql\n  fragment Money on MoneyV2 {\n    amount\n    currencyCode\n  }\n\n\n': {
    return: ProductByHandleQuery;
    variables: ProductByHandleQueryVariables;
  };
}

interface GeneratedMutationTypes {}

declare module '@shopify/hydrogen' {
  interface StorefrontQueries extends GeneratedQueryTypes {}
  interface StorefrontMutations extends GeneratedMutationTypes {}
}
