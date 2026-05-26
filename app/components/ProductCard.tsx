import {Link} from 'react-router';
import type {Product} from '~/lib/mock-data';
import {Money} from './Money';

export function ProductCard({product}: {product: Product}) {
  return (
    <Link
      to={`/products/${product.handle}`}
      className="product-card group block"
    >
      <div className="product-card-image aspect-[3/4]">
        <img
          src={product.featuredImage.url}
          alt={product.featuredImage.altText ?? product.title}
          loading="lazy"
          className="w-full h-full object-cover image-grade"
        />
      </div>
      <div className="pt-5">
        <h3 className="display-card text-ink">{product.title}</h3>
        <div className="mt-1.5 caption text-ash">
          <Money money={product.priceRange.minVariantPrice} />
        </div>
      </div>
    </Link>
  );
}
