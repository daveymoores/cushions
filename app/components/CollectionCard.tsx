import {Link} from 'react-router';
import type {Collection} from '~/lib/mock-data';

export function CollectionCard({collection}: {collection: Collection}) {
  return (
    <Link to={`/collections/${collection.handle}`} className="product-card group block">
      <div className="product-card-image aspect-[3/4]">
        <img
          src={collection.image.url}
          alt={collection.image.altText ?? collection.title}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="pt-5 flex items-baseline justify-between">
        <h3 className="font-serif font-light text-[20px] tracking-[-0.01em]">
          {collection.title}
        </h3>
        <span className="eyebrow">View</span>
      </div>
    </Link>
  );
}
