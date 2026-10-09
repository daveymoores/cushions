import {
  createHydrogenContext,
  createWithCache,
  InMemoryCache,
  type WithCache,
} from '@shopify/hydrogen';
import {AppSession} from '~/lib/session';

type AdditionalContextType = {
  /**
   * Cached fetches to third parties (the Behold Instagram feed), on the same
   * cache and `waitUntil` as the Storefront client — so stale-while-revalidate
   * refreshes in the background instead of holding up the response.
   */
  withCache: WithCache;
};

declare global {
  interface HydrogenAdditionalContext extends AdditionalContextType {}
}

/**
 * Oxygen (and mini-oxygen, used by `npm run dev`) supports named caches via
 * `caches.open('hydrogen')`. Fall back to an in-memory cache on any runtime
 * where the Cache API is unavailable so the app still boots.
 */
async function openCache(): Promise<Cache> {
  try {
    return await caches.open('hydrogen');
  } catch {
    return new InMemoryCache() as unknown as Cache;
  }
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
    openCache(),
    AppSession.init(request, [env.SESSION_SECRET]),
  ]);

  const additionalContext: AdditionalContextType = {
    withCache: createWithCache({cache, waitUntil, request}),
  };

  const hydrogenContext = createHydrogenContext(
    {
      env,
      request,
      cache,
      waitUntil,
      session,
      i18n: {language: 'EN', country: 'US'},
      // No cart fragment override — Hydrogen's default full-cart query
      // (lines, cost, checkoutUrl, totalQuantity) is exactly what we render.
    },
    additionalContext,
  );

  return hydrogenContext;
}
