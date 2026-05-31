/**
 * Until a real Shopify store is connected, the env points at `mock.shop` and we
 * serve the local mock-data layer so the design renders in full. Once
 * `shopify hydrogen env pull` writes real credentials, `PUBLIC_STORE_DOMAIN`
 * changes and every loader automatically switches to live Storefront API data —
 * no code change required.
 */
export function usesMockData(env: Env): boolean {
  return !env.PUBLIC_STORE_DOMAIN || env.PUBLIC_STORE_DOMAIN === 'mock.shop';
}
