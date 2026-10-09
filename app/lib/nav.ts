/**
 * Navigation: the merchant's Shopify menu turned into links this app can route
 * to, plus the one map of page handles that have a bespoke route.
 *
 * Menu items come back from the Storefront API as *absolute* URLs on whichever
 * domain the shop is published under, so every item has to be re-based onto
 * this app before it can be handed to React Router.
 */
import type {NavMenuFragment} from 'storefrontapi.generated';

/**
 * Page handles that have a hand-built route of their own. `/pages/<handle>`
 * 301s to it so the same content never lives at two indexable URLs, and the
 * nav points straight at the bespoke route so a menu item skips that hop.
 */
export const RESERVED_HANDLES: Record<string, string> = {
  atelier: '/atelier',
  fabrics: '/materials',
};

/**
 * Handle of the store's one collection. `/collections` redirects to it, and
 * the "Shop" breadcrumb in product structured data points at it directly so
 * Google isn't handed the redirect.
 */
export const SHOP_COLLECTION_HANDLE = 'cushions';

/** A single primary-nav entry, already resolved to something renderable. */
export type NavLink = {
  id: string;
  label: string;
  /** An app-relative path, or an absolute URL when `external` is true. */
  to: string;
  /** Off-site: render as a plain anchor, never as a React Router `<Link>`. */
  external: boolean;
};

/**
 * A footer column: one top-level menu item's title, with its children as links.
 * The heading itself is never a link — Shopify makes a URL mandatory on every
 * menu item, so a parent's own URL is a formality here and is ignored.
 */
export type NavColumn = {
  id: string;
  title: string;
  links: NavLink[];
};

type ApiMenu = NavMenuFragment | null | undefined;
/**
 * Structural, so the same mapper serves both levels: codegen gives the two
 * nesting levels distinct (but identically shaped) types.
 */
type ApiMenuItem = {id: string; title: string; url?: string | null};

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

/** The Shopify blog whose articles this site renders at `/journal`. */
const JOURNAL_BLOG_HANDLE = 'journal';

/**
 * Rewrite the paths Shopify's own link pickers emit onto the routes this site
 * actually has. Two cases, both of which a merchant hits by choosing the
 * obvious option in Navigation:
 *
 * - `/pages/<handle>` for pages we render at a bespoke path (see
 *   `RESERVED_HANDLES`).
 * - `/blogs/journal` and `/blogs/journal/<article>`, which the Blog and Blog
 *   post pickers produce. There is no `blogs.*` route — those live at
 *   `/journal` — so without this the link 404s and the merchant has no way to
 *   know why.
 *
 * Any other path is returned unchanged. The catch-all route (`routes/$.tsx`)
 * runs request paths through this too, so the same URLs arriving from outside
 * the nav — the Online Store theme, old links, search results — 301 instead of
 * 404ing.
 */
export function applyReservedHandles(pathname: string): string {
  const blog = /^\/blogs\/([^/]+)(?:\/([^/]+))?\/?$/.exec(pathname);
  if (blog && blog[1] === JOURNAL_BLOG_HANDLE) {
    return blog[2] ? `/journal/${blog[2]}` : '/journal';
  }

  const handle = /^\/pages\/([^/]+)\/?$/.exec(pathname)?.[1];
  if (!handle) return pathname;
  return Object.hasOwn(RESERVED_HANDLES, handle)
    ? RESERVED_HANDLES[handle]
    : pathname;
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
 * Every host that means "this shop". Derived, never hardcoded: the myshopify
 * domain stops being the public one at go-live.
 */
function internalHostsOf(
  primaryDomainUrl: string | null | undefined,
  env: Env,
): Set<string> {
  return new Set(
    [env.PUBLIC_STORE_DOMAIN, primaryDomainUrl, env.PUBLIC_SITE_URL]
      .map(hostnameOf)
      .filter((host): host is string => host !== null),
  );
}

/**
 * Map a Shopify menu's top row onto app links, for the header. Items without a
 * usable URL are dropped, so an empty result means "nothing renderable" and the
 * caller should fall back.
 *
 * Children are ignored here: the header has no dropdown, and a parent item
 * always carries a URL of its own, so a nested menu still renders its top row.
 */
export function toNavLinks(
  menu: ApiMenu,
  primaryDomainUrl: string | null | undefined,
  env: Env,
): NavLink[] {
  const internalHosts = internalHostsOf(primaryDomainUrl, env);

  return (menu?.items ?? [])
    .map((item) => toNavLink(item, internalHosts))
    .filter((link): link is NavLink => link !== null);
}

/**
 * Map a Shopify menu onto footer columns: each top-level item becomes a column
 * heading and its children become that column's links, sharing every URL rule
 * with `toNavLinks`.
 *
 * A top-level item with no usable children is dropped rather than rendered as a
 * bare heading, so a *flat* menu — every item a link, none nested — maps to
 * zero columns and the caller falls back to its hardcoded columns. A third
 * level of nesting is not requested and is therefore ignored.
 */
export function toNavColumns(
  menu: ApiMenu,
  primaryDomainUrl: string | null | undefined,
  env: Env,
): NavColumn[] {
  const internalHosts = internalHostsOf(primaryDomainUrl, env);

  return (menu?.items ?? [])
    .map((item) => ({
      id: item.id,
      title: item.title,
      links: (item.items ?? [])
        .map((child) => toNavLink(child, internalHosts))
        .filter((link): link is NavLink => link !== null),
    }))
    .filter((column) => column.links.length > 0);
}
