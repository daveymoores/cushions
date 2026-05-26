import {Link} from 'react-router';
import type {Collection} from '~/lib/mock-data';

export function CollectionCard({collection}: {collection: Collection}) {
  return (
    <Link
      to={`/collections/${collection.handle}`}
      className="product-card group block relative"
    >
      <div className="product-card-image aspect-[5/7]">
        <img
          src={collection.image.url}
          alt={collection.image.altText ?? collection.title}
          loading="lazy"
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
