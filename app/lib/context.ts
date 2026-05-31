import {createHydrogenContext, InMemoryCache} from '@shopify/hydrogen';
import {AppSession} from '~/lib/session';

const additionalContext = {} as const;
type AdditionalContextType = typeof additionalContext;

declare global {
  interface HydrogenAdditionalContext extends AdditionalContextType {}
}

/**
 * Open a cache that works on both Oxygen and Cloudflare Workers.
 * Oxygen supports named caches (`caches.open('hydrogen')`); Cloudflare Workers
 * only exposes `caches.default`. Fall back gracefully so the same build runs
 * on either host.
 */
async function openCache(): Promise<Cache> {
  try {
    return await caches.open('hydrogen');
  } catch {
    const fallback = (caches as unknown as {default?: Cache}).default;
    return fallback ?? (new InMemoryCache() as unknown as Cache);
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
