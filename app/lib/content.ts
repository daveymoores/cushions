/**
 * Site editorial content from a singleton `homepage` metaobject.
 *
 * Create a metaobject definition of type `homepage` (Settings → Custom data →
 * Metaobjects) with **Storefront access enabled** and these fields, then add a
 * single entry. Any field left blank falls back to the built-in copy.
 *
 *   announcement        multi-line text  (one marquee message per line)
 *   hero_eyebrow        single line text
 *   hero_heading        multi-line text
 *   hero_cta_label      single line text
 *   hero_image          file → image
 *   intro               multi-line text
 *   mending_heading     single line text
 *   mending_body        multi-line text
 *   material_heading    single line text
 *   material_body       multi-line text
 *   commission_heading  single line text
 *   newsletter_heading  single line text
 *   newsletter_body     multi-line text
 */
import {useRouteLoaderData} from 'react-router';
import type {SiteContentQuery} from 'storefrontapi.generated';
import type {ImageT} from '~/lib/mock-data';
import type {RootLoader} from '~/root';

type ContentNode = SiteContentQuery['metaobjects']['nodes'][number];
type ContentField = ContentNode['fields'][number];

export type SiteContent = {
  announcement?: string;
  heroEyebrow?: string;
  heroHeading?: string;
  heroCtaLabel?: string;
  heroImage?: ImageT | null;
  intro?: string;
  mendingHeading?: string;
  mendingBody?: string;
  materialHeading?: string;
  materialBody?: string;
  commissionHeading?: string;
  newsletterHeading?: string;
  newsletterBody?: string;
};

function imageFromRef(field: ContentField | undefined): ImageT | null {
  const ref = field?.reference;
  if (!ref || !('image' in ref) || !ref.image) return null;
  const img = ref.image;
  return {
    id: img.id ?? img.url,
    url: img.url,
    altText: img.altText ?? null,
    width: img.width ?? 0,
    height: img.height ?? 0,
  };
}

/** Read site content from the root loader (empty object before it's authored). */
export function useSiteContent(): SiteContent {
  return useRouteLoaderData<RootLoader>('root')?.content ?? {};
}

export function toSiteContent(query: SiteContentQuery): SiteContent {
  const node = query.metaobjects.nodes[0];
  if (!node) return {};
  const fields = new Map(node.fields.map((f) => [f.key, f]));
  const text = (key: string) => fields.get(key)?.value || undefined;

  return {
    announcement: text('announcement'),
    heroEyebrow: text('hero_eyebrow'),
    heroHeading: text('hero_heading'),
    heroCtaLabel: text('hero_cta_label'),
    heroImage: imageFromRef(fields.get('hero_image')),
    intro: text('intro'),
    mendingHeading: text('mending_heading'),
    mendingBody: text('mending_body'),
    materialHeading: text('material_heading'),
    materialBody: text('material_body'),
    commissionHeading: text('commission_heading'),
    newsletterHeading: text('newsletter_heading'),
    newsletterBody: text('newsletter_body'),
  };
}
