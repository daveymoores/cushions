/**
 * Social profiles: the one list behind both the footer's icon row and the
 * Organization's `sameAs` in structured data, so the two can never disagree.
 *
 * Merchant-editable through a Shopify menu with the handle `social` (Online
 * Store → Navigation): one top-level item per profile, in the order they should
 * appear. An item's title is only shown for a site we have no icon for. When
 * that menu is missing, empty or fails to load, `FALLBACK_SOCIAL_LINKS` is used,
 * so the icons show without any admin work.
 */
import type {NavMenuFragment} from 'storefrontapi.generated';
import {toNavLinks, type NavLink} from '~/lib/nav';

/**
 * The profiles listed on FAR-118. Pinterest is the profile the `pin.it` share
 * link resolves to, and Etsy has its `?ref=` tracking parameter dropped, so
 * `sameAs` carries each profile's canonical address.
 */
export const FALLBACK_SOCIAL_LINKS: NavLink[] = [
  {
    id: 'fallback-instagram',
    label: 'Instagram',
    to: 'https://www.instagram.com/sisu_homeware/',
    external: true,
  },
  {
    id: 'fallback-pinterest',
    label: 'Pinterest',
    to: 'https://www.pinterest.com/sisu_homeware/',
    external: true,
  },
  {
    id: 'fallback-facebook',
    label: 'Facebook',
    to: 'https://www.facebook.com/profile.php?id=61595106993122',
    external: true,
  },
  {
    id: 'fallback-etsy',
    label: 'Etsy',
    to: 'https://www.etsy.com/shop/SisuHomeware',
    external: true,
  },
];

/**
 * Map the `social` menu onto links, sharing every URL rule with the header nav.
 * Only off-site web addresses survive: a profile is never a page on this site,
 * and `sameAs` must be a URL. An empty result means the caller should fall back.
 */
export function toSocialLinks(
  menu: NavMenuFragment | null | undefined,
  primaryDomainUrl: string | null | undefined,
  env: Env,
): NavLink[] {
  return toNavLinks(menu, primaryDomainUrl, env).filter(
    (link) => link.external && /^https?:\/\//i.test(link.to),
  );
}

export type SocialPlatform = 'instagram' | 'pinterest' | 'facebook' | 'etsy';

export const SOCIAL_PLATFORM_NAMES: Record<SocialPlatform, string> = {
  instagram: 'Instagram',
  pinterest: 'Pinterest',
  facebook: 'Facebook',
  etsy: 'Etsy',
};

/**
 * Which brand icon a link gets, decided by its host. Anything unrecognised
 * returns `null` and renders as its menu title instead.
 */
export function socialPlatformOf(href: string): SocialPlatform | null {
  let host: string;
  try {
    host = new URL(href).hostname.toLowerCase();
  } catch {
    return null;
  }
  const on = (domain: string) => host === domain || host.endsWith(`.${domain}`);

  if (on('instagram.com') || on('instagr.am')) return 'instagram';
  // Pinterest runs country domains (pinterest.co.uk, nl.pinterest.com, …) and
  // shares profiles as `pin.it` short links.
  if (on('pin.it') || /(^|\.)pinterest\.[a-z]{2,3}(\.[a-z]{2})?$/.test(host)) {
    return 'pinterest';
  }
  if (on('facebook.com') || on('fb.com') || on('fb.me')) return 'facebook';
  if (on('etsy.com') || on('etsy.me')) return 'etsy';
  return null;
}
