/**
 * "In situ" — the lifestyle photography pulled out of the product carousel and
 * given its own editorial section. See `~/lib/product-media` for how images are
 * sorted into this bucket.
 *
 * One treatment: a full-bleed contact sheet on bone. The row starts on the text
 * grid — the first photograph's left edge is the heading's left edge — and runs
 * off the right edge of the band, which is what says "there is more". A single
 * photograph gets its own branch: a sequence of one isn't a sequence, so it
 * drops the number and the bleed and simply sits on the same left edge.
 */
import type {ImageT} from '~/lib/mock-data';
import {Container} from './Container';
import {Eyebrow} from './Eyebrow';
import {ResponsiveImage} from './ResponsiveImage';
import {SealMark} from './SealMark';

type Props = {
  images: ImageT[];
  productTitle: string;
};

const EYEBROW = 'In situ';
const HEADING = 'Lived with';

/** "01", "02", … — only used where there is a sequence to number. */
const index = (i: number) => String(i + 1).padStart(2, '0');

/** Alt text doubles as the caption line; the product title is the fallback. */
const caption = (img: ImageT, productTitle: string) =>
  img.altText ?? productTitle;

export function ProductInSitu({images, productTitle}: Props) {
  // Most products have no lifestyle photography yet: render nothing at all —
  // no heading, no rule, no margin.
  if (images.length === 0) return null;

  const solo = images.length === 1;

  return (
    <section className="pb-[var(--section-y-sm)]">
      <div className="insitu-band relative bg-bone section-y overflow-hidden noise-overlay">
        <Container>
          <div className="flex items-center gap-4 mb-6">
            <SealMark size={14} className="text-ink/70" />
            <Eyebrow>{EYEBROW}</Eyebrow>
          </div>
          <h2 className="display-h1 text-ink">{HEADING}</h2>
        </Container>

        {solo ? (
          <div className="insitu-solo mt-12 lg:mt-16">
            <figure>
              <div className="insitu-frame aspect-[4/3] lg:aspect-[3/2]">
                {/* `.insitu-solo` is padded by `--insitu-inset` / `--insitu-gutter`
                    (24px, 56px from lg; the inset also absorbs the container's
                    auto-centring past 1320px), and the figure takes 1/1.6 of
                    that from sm up. No `aspectRatio`: the frame is 4/3 below lg
                    and 3/2 above, so the crop is breakpoint-dependent. */}
                <ResponsiveImage
                  src={images[0].url}
                  alt={caption(images[0], productTitle)}
                  sizes="(min-width: 1320px) calc((50vw + 548px) / 1.6), (min-width: 1024px) calc((100vw - 112px) / 1.6), (min-width: 640px) calc((100vw - 48px) / 1.6), calc(100vw - 48px)"
                  className="w-full h-full object-cover image-grade"
                />
              </div>
              <figcaption className="caption mt-5">
                {caption(images[0], productTitle)}
              </figcaption>
            </figure>
          </div>
        ) : (
          <div
            className="insitu-scroller mt-12 lg:mt-16"
            data-count={images.length}
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable region must be keyboard-reachable
            tabIndex={0}
            role="group"
            aria-label={`${productTitle} — in situ photographs`}
          >
            {images.map((img, i) => (
              <figure key={img.id}>
                <div className="insitu-frame aspect-square">
                  {/* Flex row of `--insitu-cols` items (1.2 / 1.9 / 2.5, but 2
                      when `data-count="2"`) separated by `--insitu-gap`, inside
                      the band's leading inset. Sized for the widest case at each
                      breakpoint so the value is never short. */}
                  <ResponsiveImage
                    src={img.url}
                    alt={caption(img, productTitle)}
                    aspectRatio="1/1"
                    sizes="(min-width: 1320px) calc((50vw + 516px) / 2), (min-width: 1024px) calc((100vw - 144px) / 2), (min-width: 640px) calc((100vw - 66px) / 1.9), calc((100vw - 52px) / 1.2)"
                    className="w-full h-full object-cover image-grade"
                  />
                </div>
                <Eyebrow className="block mt-5">{index(i)}</Eyebrow>
                <figcaption className="caption mt-2">
                  {caption(img, productTitle)}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
