/**
 * The homepage's latest-from-Instagram strip — see `~/lib/instagram` for where
 * the posts come from and when there are none.
 *
 * Laid out like the featured collection above it (eyebrow, heading, a static
 * underline link on the right) so it reads as part of the page rather than an
 * embed: square tiles on bone, graded like the product photography, with the
 * same slow zoom on hover.
 */
import type {InstagramFeed as Feed} from '~/lib/instagram';
import {Container} from './Container';
import {Eyebrow} from './Eyebrow';

const EYEBROW = 'On Instagram';
const CTA_LABEL = 'Follow on Instagram';

/**
 * Rendered tile widths. Six tiles: three across (`gap-2`, 8px) below md, then
 * one row of six (`gap-3` 12px, `gap-4` 16px from lg), inside the container's
 * 24px / 56px gutters and 1320px cap. Three tiles: three across at every width.
 */
const SIZES = {
  6: '(min-width: 1320px) 188px, (min-width: 1024px) calc((100vw - 192px) / 6), (min-width: 768px) calc((100vw - 108px) / 6), calc((100vw - 64px) / 3)',
  3: '(min-width: 1320px) 392px, (min-width: 1024px) calc((100vw - 144px) / 3), (min-width: 768px) calc((100vw - 72px) / 3), calc((100vw - 64px) / 3)',
} as const;

export function InstagramFeed({feed}: {feed: Feed}) {
  // Rows are always full: six (two rows of three on a phone), or three. One or
  // two posts would read as a broken grid, so the section steps aside instead.
  const count = feed.posts.length >= 6 ? 6 : feed.posts.length >= 3 ? 3 : 0;
  if (count === 0) return null;
  const posts = feed.posts.slice(0, count);

  return (
    // No bottom padding: the footer's own top margin is the gap below.
    <section
      className="bg-paper pt-[var(--section-y)]"
      aria-labelledby="instagram-heading"
    >
      <Container>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 md:mb-14">
          <div>
            <Eyebrow className="block mb-4">{EYEBROW}</Eyebrow>
            <h2 id="instagram-heading" className="display-h2 text-ink">
              Lately at <span className="italic-stone">@{feed.username}</span>
            </h2>
          </div>
          <a
            href={feed.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline-link is-static eyebrow text-ink self-start md:self-end"
          >
            {CTA_LABEL}
          </a>
        </div>
        <ul
          className={`grid grid-cols-3 gap-2 md:gap-3 lg:gap-4 ${
            count === 6 ? 'md:grid-cols-6' : ''
          }`}
        >
          {posts.map((post) => (
            <li key={post.id}>
              <a
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block aspect-square overflow-hidden bg-bone focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <img
                  src={post.src}
                  srcSet={post.srcSet}
                  sizes={post.srcSet ? SIZES[count] : undefined}
                  alt={post.alt}
                  width={post.width}
                  height={post.height}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover image-grade transition-transform duration-[1800ms] ease-quiet group-hover:scale-[1.025] group-focus-visible:scale-[1.025] motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-focus-visible:scale-100"
                />
              </a>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
