/**
 * Navigation: the merchant's Shopify menu turned into links this app can route
 * to, plus the one map of page handles that have a bespoke route.
 *
 * Menu items come back from the Storefront API as *absolute* URLs on whichever
 * domain the shop is published under, so every item has to be re-based onto
 * this app before it can be handed to React Router.
 */
import type {MenuQuery} from 'storefrontapi.generated';

/**
 * Page handles that have a hand-built route of their own. `/pages/<handle>`
 * 301s to it so the same content never lives at two indexable URLs, and the
 * nav points straight at the bespoke route so a menu item skips that hop.
 */
export const RESERVED_HANDLES: Record<string, string> = {
  atelier: '/atelier',
};

/** A single primary-nav entry, already resolved to something renderable. */
export type NavLink = {
  id: string;
  label: string;
  /** An app-relative path, or an absolute URL when `external` is true. */
  to: string;
  /** Off-site: render as a plain anchor, never as a React Router `<Link>`. */
  external: boolean;
};

type ApiMenu = MenuQuery['menu'];
type ApiMenuItem = NonNullable<ApiMenu>['items'][number];

/**
 * Reserved TLD, so a relative `url` can be parsed with the same code path as an
 * absolute one without ever colliding with a real host.
 */
const RELATIVE_BASE = 'https://relative.invalid';

/**
 * `PUBLIC_STORE_DOMAIN` is a bare host, `primaryDomain.url` and
 * `PUBLIC_SITE_URL` are origins. Normalise all three to a lowercase hostname.
 */
function hostnameOf(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    return new URL(withScheme).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/** `/pages/atelier` → `/atelier`. Any other path is returned unchanged. */
function applyReservedHandles(pathname: string): string {
  const handle = /^\/pages\/([^/]+)\/?$/.exec(pathname)?.[1];
  if (!handle) return pathname;
  return RESERVED_HANDLES[handle] ?? pathname;
}

function toNavLink(
  item: ApiMenuItem,
  internalHosts: Set<string>,
): NavLink | null {
  const raw = item.url?.trim();
  if (!raw) return null;

  let parsed: URL;
  try {
    parsed = new URL(raw, RELATIVE_BASE);
  } catch {
    return null;
  }

  // mailto:, tel: and anything else non-web stay exactly as authored.
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {id: item.id, label: item.title, to: raw, external: true};
  }

  // The host is what decides internal vs external — not `item.type`. The live
  // "Shop" item is type CATALOG with a null `resourceId`, so the enum doesn't
  // map cleanly onto this app's routes while the URL path does.
  const isInternal =
    parsed.origin === RELATIVE_BASE ||
    internalHosts.has(parsed.hostname.toLowerCase());

  if (!isInternal) {
    return {id: item.id, label: item.title, to: parsed.href, external: true};
  }

  return {
    id: item.id,
    label: item.title,
    to: `${applyReservedHandles(parsed.pathname)}${parsed.search}${parsed.hash}`,
    external: false,
  };
}

/**
 * Map a Shopify menu onto app links. Items without a usable URL are dropped, so
 * an empty result means "nothing renderable" and the caller should fall back.
 *
 * Second-level items (`items.items`) are deliberately not requested or
 * rendered: neither surface has a dropdown, and a parent item always carries a
 * URL of its own, so a menu with children still renders its top row.
 */
export function toNavLinks(
  menu: ApiMenu,
  primaryDomainUrl: string | null | undefined,
  env: Env,
): NavLink[] {
  // Every host that means "this shop". Derived, never hardcoded: the myshopify
  // domain stops being the public one at go-live.
  const internalHosts = new Set(
    [env.PUBLIC_STORE_DOMAIN, primaryDomainUrl, env.PUBLIC_SITE_URL]
      .map(hostnameOf)
      .filter((host): host is string => host !== null),
  );

  return (menu?.items ?? [])
    .map((item) => toNavLink(item, internalHosts))
    .filter((link): link is NavLink => link !== null);
}
