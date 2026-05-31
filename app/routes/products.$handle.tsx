import {useState} from 'react';
import {useLoaderData, data} from 'react-router';
import {CartForm} from '@shopify/hydrogen';
import type {Route} from './+types/products.$handle';
import {Container} from '~/components/Container';
import {Eyebrow} from '~/components/Eyebrow';
import {Money} from '~/components/Money';
import {SealMark} from '~/components/SealMark';
import {UnderlineLink} from '~/components/UnderlineLink';
import {getProductByHandle} from '~/lib/mock-data';
import {PRODUCT_QUERY} from '~/lib/queries';
import {toProduct} from '~/lib/adapters';
import {usesMockData} from '~/lib/storefront';

export const meta: Route.MetaFunction = ({data: routeData}) => {
  const title = routeData?.product?.title ?? 'Product';
  return [{title: `${title} — Sisu`}];
};

export async function loader({params, context}: Route.LoaderArgs) {
  const {handle} = params;
  if (!handle) throw new Response('Not found', {status: 404});

  if (usesMockData(context.env)) {
    const product = getProductByHandle(handle);
    if (!product) throw new Response('Not found', {status: 404});
    return data({product});
  }

  const {product} = await context.storefront.query(PRODUCT_QUERY, {
    variables: {handle},
  });
  if (!product) throw new Response('Not found', {status: 404});
  return data({product: toProduct(product)});
}

export default function ProductPage() {
  const {product} = useLoaderData<typeof loader>();
  const [activeImage, setActiveImage] = useState(0);
  const image = product.images[activeImage] ?? product.images[0];

  // Track the chosen option values and resolve them to a concrete variant.
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        (product.variants.nodes[0]?.selectedOptions ?? []).map((o) => [
          o.name,
          o.value,
        ]),
      ),
  );
  const variant =
    product.variants.nodes.find((v) =>
      v.selectedOptions.every((o) => selectedOptions[o.name] === o.value),
    ) ?? product.variants.nodes[0];

  const objectRecord: {label: string; value: string}[] = [
    {label: 'Fiber', value: product.tags[0] ?? '—'},
    {label: 'Origin', value: 'Sewn in north London'},
    {label: 'Loom', value: 'Single-loom, small-batch'},
    {label: 'Care', value: 'Cool wash · line dry · cool iron'},
    {label: 'Repair', value: 'Mended for life — return when it tires'},
  ];

  return (
    <Container className="section-y">
      <div className="mb-12">
        <UnderlineLink
          to="/collections/the-atelier-collection"
          className="eyebrow text-ash hover:text-ink"
        >
          ← Back to the collection
        </UnderlineLink>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
        <div className="lg:col-span-7">
          <figure className="aspect-[4/5] bg-bone overflow-hidden">
            <img
              src={image.url}
              alt={image.altText ?? product.title}
              loading="eager"
              className="w-full h-full object-cover image-grade"
            />
          </figure>
          {product.images.length > 1 ? (
            <div className="mt-4 flex gap-3">
              {product.images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  aria-label={`View image ${i + 1}`}
                  aria-pressed={i === activeImage}
                  className={`hairline aspect-square w-20 overflow-hidden bg-bone transition-opacity ${
                    i === activeImage ? 'opacity-100' : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{
                    borderColor:
                      i === activeImage ? 'var(--color-ink)' : 'var(--color-hairline)',
                  }}
                >
                  <img
                    src={img.url}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover image-grade"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="lg:col-span-5 lg:sticky lg:top-24 self-start">
          <Eyebrow className="block mb-5">{product.productType} · No. 0{product.id.slice(-1)}</Eyebrow>
          <h1 className="display-h1 text-ink">{product.title}</h1>
          <div className="mt-5 caption text-ash">
            <Money money={product.priceRange.minVariantPrice} />
          </div>

          <div className="mt-8 w-10 h-px bg-hairline" aria-hidden="true" />

          <p className="mt-8 text-ash text-[14px] leading-[1.7] font-light max-w-md">
            {product.description}
          </p>

          {product.options.map((option) => (
            <div key={option.name} className="mt-10">
              <Eyebrow className="block mb-4">{option.name}</Eyebrow>
              <div className="flex flex-wrap gap-2">
                {option.values.map((value) => {
                  const active = selectedOptions[option.name] === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        setSelectedOptions((prev) => ({
                          ...prev,
                          [option.name]: value,
                        }))
                      }
                      className={`hairline px-4 py-2.5 text-[12px] font-light tracking-wide transition-colors cursor-pointer ${
                        active ? 'border-ink text-ink' : 'hover:border-ink'
                      }`}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="mt-12">
            <CartForm
              route="/cart"
              action={CartForm.ACTIONS.LinesAdd}
              inputs={{
                lines: variant
                  ? [{merchandiseId: variant.id, quantity: 1}]
                  : [],
              }}
            >
              <button
                type="submit"
                disabled={!variant?.availableForSale}
                className="arrow-link text-ink disabled:opacity-50"
              >
                <span>
                  {variant?.availableForSale ? 'Add to cart' : 'Sold out'}
                </span>
                <svg
                  viewBox="0 0 24 1"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <line
                    x1="0"
                    y1="0.5"
                    x2="24"
                    y2="0.5"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                </svg>
              </button>
            </CartForm>
          </div>

          <p className="caption mt-8 text-stone max-w-md">
            Sewn to order — allow 14 to 21 days for completion. Returned
            to you wrapped in unbleached cotton, with a mending card.
          </p>
        </div>
      </div>

      <section className="mt-20 lg:mt-32">
        <div className="flex items-center gap-4 mb-10">
          <SealMark size={14} className="text-ink/70" />
          <Eyebrow>Object record</Eyebrow>
        </div>
        <dl className="border-t border-hairline">
          {objectRecord.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-12 gap-6 py-5 border-b border-hairline"
            >
              <dt className="col-span-4 md:col-span-3 eyebrow">{row.label}</dt>
              <dd className="col-span-8 md:col-span-9 text-[14px] font-light text-ink">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </Container>
  );
}
