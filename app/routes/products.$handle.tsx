import {useLoaderData, data} from 'react-router';
import type {Route} from './+types/products.$handle';
import {Container} from '~/components/Container';
import {Eyebrow} from '~/components/Eyebrow';
import {Money} from '~/components/Money';
import {UnderlineLink} from '~/components/UnderlineLink';
import {getProductByHandle} from '~/lib/mock-data';

const USE_MOCK_DATA = true;

export const meta: Route.MetaFunction = ({data: routeData}) => {
  const title = routeData?.product?.title ?? 'Product';
  return [{title: `${title} — Maison Lévantine`}];
};

export async function loader({params}: Route.LoaderArgs) {
  const {handle} = params;
  if (!handle) throw new Response('Not found', {status: 404});

  if (USE_MOCK_DATA) {
    const product = getProductByHandle(handle);
    if (!product) throw new Response('Not found', {status: 404});
    return data({product});
  }

  // Real Shopify path:
  // const {storefront} = _args.context;
  // const {product} = await storefront.query(PRODUCT_QUERY, {variables: {handle}});
  // if (!product) throw new Response('Not found', {status: 404});
  // return data({product});

  throw new Error('USE_MOCK_DATA is false but no real loader is wired up.');
}

export default function ProductPage() {
  const {product} = useLoaderData<typeof loader>();
  const variant = product.variants.nodes[0];

  return (
    <Container className="section-y">
      <div className="mb-12">
        <UnderlineLink
          to="/collections/the-atelier-collection"
          className="eyebrow text-stone"
        >
          ← Back to the collection
        </UnderlineLink>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20">
        <div className="space-y-6">
          {product.images.map((image) => (
            <div
              key={image.id}
              className="aspect-[4/5] bg-bone overflow-hidden"
            >
              <img
                src={image.url}
                alt={image.altText ?? product.title}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
        <div className="lg:sticky lg:top-32 self-start">
          <Eyebrow className="block mb-6">{product.productType}</Eyebrow>
          <h1 className="font-serif font-light text-[40px] sm:text-[52px] leading-[0.95] tracking-[-0.02em]">
            {product.title}
          </h1>
          <div className="mt-6 font-serif text-[20px]">
            <Money money={product.priceRange.minVariantPrice} />
          </div>
          <p className="mt-8 text-stone text-[15px] leading-relaxed font-light">
            {product.description}
          </p>

          {product.options.map((option) => (
            <div key={option.name} className="mt-10">
              <Eyebrow className="block mb-4">{option.name}</Eyebrow>
              <div className="flex flex-wrap gap-3">
                {option.values.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className="border border-hairline px-4 py-2 text-[13px] font-light hover:border-ink transition-colors cursor-pointer"
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <button
            type="button"
            disabled={!variant?.availableForSale}
            className="btn-bleed text-ink mt-12 w-full md:w-auto"
          >
            Add to cart
          </button>

          <div className="mt-12 border-t border-hairline pt-8 space-y-4 text-stone text-[13px] font-light leading-relaxed">
            <p>Sewn to order. Allow 14–21 days for completion.</p>
            <p>Repaired for life — return it when it tires.</p>
          </div>
        </div>
      </div>
    </Container>
  );
}
