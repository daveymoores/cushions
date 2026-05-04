import {createHydrogenContext} from '@shopify/hydrogen';
import {AppSession} from '~/lib/session';

/**
 * Minimal cart line fragment used by the Hydrogen cart context.
 * Replace with the full CART_QUERY_FRAGMENT once we wire up real Shopify data
 * and re-add `app/lib/fragments.ts` from the skeleton template.
 */
const CART_QUERY_FRAGMENT = `#graphql
  fragment CartLine on CartLine {
    id
    quantity
    attributes {
      key
      value
    }
    cost {
      totalAmount {
        amount
        currencyCode
      }
      amountPerQuantity {
        amount
        currencyCode
      }
      compareAtAmountPerQuantity {
        amount
        currencyCode
      }
    }
    merchandise {
      ... on ProductVariant {
        id
        availableForSale
        compareAtPrice {
          amount
          currencyCode
        }
        price {
          amount
          currencyCode
        }
        requiresShipping
        title
        image {
          id
          url
          altText
          width
          height
        }
        product {
          handle
          title
          id
          vendor
        }
        selectedOptions {
          name
          value
        }
      }
    }
  }
` as const;

const additionalContext = {} as const;
type AdditionalContextType = typeof additionalContext;

declare global {
  interface HydrogenAdditionalContext extends AdditionalContextType {}
}

export async function createHydrogenRouterContext(
  request: Request,
  env: Env,
  executionContext: ExecutionContext,
) {
  if (!env?.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is not set');
  }

  const waitUntil = executionContext.waitUntil.bind(executionContext);
  const [cache, session] = await Promise.all([
    caches.open('hydrogen'),
    AppSession.init(request, [env.SESSION_SECRET]),
  ]);

  const hydrogenContext = createHydrogenContext(
    {
      env,
      request,
      cache,
      waitUntil,
      session,
      i18n: {language: 'EN', country: 'US'},
      cart: {queryFragment: CART_QUERY_FRAGMENT},
    },
    additionalContext,
  );

  return hydrogenContext;
}
