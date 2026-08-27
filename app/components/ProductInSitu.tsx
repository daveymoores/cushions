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
                <img
                  src={images[0].url}
                  alt={caption(images[0], productTitle)}
                  loading="lazy"
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
                  <img
                    src={img.url}
                    alt={caption(img, productTitle)}
                    loading="lazy"
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
