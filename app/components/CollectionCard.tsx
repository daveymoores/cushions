import {Link} from 'react-router';
import type {Collection} from '~/lib/mock-data';
import {ResponsiveImage} from './ResponsiveImage';

export function CollectionCard({collection}: {collection: Collection}) {
  const image = collection.image;

  return (
    <Link
      to={`/collections/${collection.handle}`}
      className="product-card group block relative"
    >
      {/* `.product-card-image` is already filled with bone, so a collection
          with no photograph keeps its slot in the grid as an empty frame. */}
      <div className="product-card-image aspect-[5/7]">
        {image ? (
          <>
            {/* 2 cols, 4 from lg, `gap-x-6` = 24px gutters (both grids). */}
            <ResponsiveImage
              src={image.url}
              alt={image.altText ?? collection.title}
              aspectRatio="5/7"
              sizes="(min-width: 1320px) 284px, (min-width: 1024px) calc((100vw - 184px) / 4), calc((100vw - 72px) / 2)"
              className="w-full h-full object-cover image-grade"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(to top, rgba(28,26,22,0.45) 0%, rgba(28,26,22,0.0) 30%)',
              }}
            />
          </>
        ) : null}
        {/* The scrim exists to lift the label off a photograph. On the empty
            bone frame there is nothing to lift it off, and paper-on-bone is
            too low a contrast to read — so the label inverts to ink instead. */}
        <div
          className={`absolute inset-x-0 bottom-0 p-6 ${
            image ? 'text-paper' : 'text-ink'
          }`}
        >
          <span
            className={`eyebrow block mb-2 ${
              image ? 'text-paper/70' : 'text-ash'
            }`}
          >
            View
          </span>
          <h3 className={`display-card ${image ? 'text-paper' : 'text-ink'}`}>
            {collection.title}
          </h3>
        </div>
      </div>
    </Link>
  );
}
