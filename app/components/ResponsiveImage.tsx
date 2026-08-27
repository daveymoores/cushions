import type {ImgHTMLAttributes} from 'react';
import {Image} from '@shopify/hydrogen';

/**
 * One image element for the whole storefront, so every slot ships a `srcSet`.
 *
 * Shopify-served URLs go through Hydrogen's `Image`, which rewrites the URL
 * with `width`/`height`/`crop` transform params and builds the `srcSet` for us.
 * The seeded Unsplash placeholders (`placeholderImages` in ~/lib/mock-data, and
 * the `?? placeholder` fallbacks on the homepage) aren't Shopify URLs — those
 * params would be ignored and every candidate would resolve to the same bytes —
 * so they render as a plain `<img>` with a hand-rolled Unsplash `srcSet`.
 *
 * Callers keep full control of `className`, so the rendered layout, aspect
 * ratios and `object-cover` cropping are unchanged: this only decides which
 * bytes get delivered.
 */

type Crop = 'center' | 'top' | 'bottom' | 'left' | 'right';

export type ResponsiveImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'alt' | 'srcSet' | 'sizes' | 'loading' | 'decoding'
> & {
  src: string;
  /** Required so a call site can't silently drop the existing alt fallback. */
  alt: string;
  /**
   * Rendered CSS width of the slot per breakpoint. Derived from the real
   * container/grid maths at each call site — omit only for fixed-size images,
   * which get `1x/2x/3x` descriptors instead.
   */
  sizes?: string;
  /**
   * Ratio of the slot, e.g. `3/4`. Lets the CDN crop server-side instead of
   * shipping pixels that `object-cover` throws away. Leave unset where the
   * ratio depends on the viewport (the full-bleed hero and commission bands).
   */
  aspectRatio?: string;
  crop?: Crop;
  /** Above the fold: eager with `fetchpriority="high"` rather than lazy. */
  priority?: boolean;
};

/**
 * The image hosts allowed by `imgSrc` in app/entry.server.tsx, minus Unsplash.
 * Only these accept Shopify's `?width=&height=&crop=` transform params.
 */
function isShopifyImage(src: string): boolean {
  let hostname: string;
  try {
    ({hostname} = new URL(src));
  } catch {
    // Relative paths (bundled assets) can't be transformed either.
    return false;
  }
  return (
    hostname === 'shopify.com' ||
    hostname.endsWith('.shopify.com') ||
    hostname.endsWith('.shopifycdn.com') ||
    hostname.endsWith('.myshopify.com')
  );
}

const UNSPLASH_WIDTHS = [200, 400, 600, 800, 1200, 1600, 2000, 2400];

/**
 * Unsplash serves imgix, which resizes on `?w=`. Only the width is varied, so
 * the source aspect ratio — and therefore the `object-cover` crop — is
 * identical to what a single full-size `src` renders today.
 */
function unsplashSrcSet(src: string): string | undefined {
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return undefined;
  }
  if (url.hostname !== 'images.unsplash.com') return undefined;
  return UNSPLASH_WIDTHS.map((width) => {
    url.searchParams.set('w', String(width));
    return `${url.href} ${width}w`;
  }).join(', ');
}

/**
 * React 18 doesn't recognise the `fetchPriority` prop — passing it camelCased
 * logs a dev warning — and the lowercase DOM attribute isn't in @types/react,
 * hence the cast. `decoding` is async on both branches because Hydrogen's
 * `Image` hardcodes that default and it can't be unset; `loading="eager"` plus
 * `fetchpriority="high"` are what matter for the LCP image.
 */
const EAGER_ATTRS = {
  loading: 'eager',
  decoding: 'async',
  fetchpriority: 'high',
} as ImgHTMLAttributes<HTMLImageElement>;

const LAZY_ATTRS: ImgHTMLAttributes<HTMLImageElement> = {
  loading: 'lazy',
  decoding: 'async',
};

export function ResponsiveImage({
  src,
  alt,
  sizes,
  aspectRatio,
  crop = 'center',
  priority = false,
  ...props
}: ResponsiveImageProps) {
  const loadingAttrs = priority ? EAGER_ATTRS : LAZY_ATTRS;

  if (isShopifyImage(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        sizes={sizes}
        aspectRatio={aspectRatio}
        crop={crop}
        {...loadingAttrs}
        {...props}
      />
    );
  }

  // Without a `sizes` the browser assumes 100vw and picks the largest
  // candidate, so only offer a srcSet once the slot width is known.
  const fallbackSizes =
    sizes ?? (typeof props.width === 'number' ? `${props.width}px` : undefined);

  return (
    <img
      src={src}
      alt={alt}
      srcSet={fallbackSizes ? unsplashSrcSet(src) : undefined}
      sizes={fallbackSizes}
      {...loadingAttrs}
      {...props}
    />
  );
}
