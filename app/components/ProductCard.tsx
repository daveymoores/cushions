import {Link} from 'react-router';
import type {Product} from '~/lib/mock-data';
import {Money} from './Money';
import {ResponsiveImage} from './ResponsiveImage';

export function ProductCard({product}: {product: Product}) {
  const image = product.featuredImage;

  return (
    <Link
      to={`/products/${product.handle}`}
      className="product-card group block"
    >
      {/* `.product-card-image` is already filled with bone, so a product with
          no photograph keeps its slot in the grid as an empty frame. */}
      <div className="product-card-image aspect-[3/4]">
        {image ? (
          /* Widest grid this card appears in: 1 col, 2 from md (collection
             page), 3 from lg (both grids), `gap-x-10` = 40px gutters. */
          <ResponsiveImage
            src={image.url}
            alt={image.altText ?? product.title}
            aspectRatio="3/4"
            sizes="(min-width: 1320px) 376px, (min-width: 1024px) calc((100vw - 192px) / 3), (min-width: 768px) calc((100vw - 88px) / 2), calc(100vw - 48px)"
            className="w-full h-full object-cover image-grade"
          />
        ) : null}
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
