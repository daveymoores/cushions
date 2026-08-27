import {Link} from 'react-router';
import type {Collection} from '~/lib/mock-data';
import {ResponsiveImage} from './ResponsiveImage';

export function CollectionCard({collection}: {collection: Collection}) {
  return (
    <Link
      to={`/collections/${collection.handle}`}
      className="product-card group block relative"
    >
      <div className="product-card-image aspect-[5/7]">
        {/* 2 cols, 4 from lg, `gap-x-6` = 24px gutters (both grids). */}
        <ResponsiveImage
          src={collection.image.url}
          alt={collection.image.altText ?? collection.title}
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
        <div className="absolute inset-x-0 bottom-0 p-6 text-paper">
          <span className="eyebrow text-paper/70 block mb-2">View</span>
          <h3 className="display-card text-paper">{collection.title}</h3>
        </div>
      </div>
    </Link>
  );
}
