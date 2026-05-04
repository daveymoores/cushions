import {Link} from 'react-router';
import type {Product} from '~/lib/mock-data';
import {Money} from './Money';

export function ProductCard({product}: {product: Product}) {
  return (
    <Link
      to={`/products/${product.handle}`}
      className="product-card group block"
    >
      <div className="product-card-image aspect-[4/5]">
        <img
          src={product.featuredImage.url}
          alt={product.featuredImage.altText ?? product.title}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="pt-6">
        <h3 className="font-serif font-light text-[22px] leading-tight tracking-[-0.01em]">
          {product.title}
        </h3>
        <p className="text-stone text-[13px] mt-2 leading-relaxed font-light line-clamp-2 max-w-md">
          {product.description}
        </p>
        <div className="mt-3 font-serif text-ink text-[15px]">
          <Money money={product.priceRange.minVariantPrice} />
        </div>
      </div>
    </Link>
  );
}
