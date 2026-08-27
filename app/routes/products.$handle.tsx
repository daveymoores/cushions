import {useEffect, useMemo, useState} from 'react';
import {useLoaderData, data} from 'react-router';
import {CartForm} from '@shopify/hydrogen';
import type {Route} from './+types/products.$handle';
import {Container} from '~/components/Container';
import {Eyebrow} from '~/components/Eyebrow';
import {Money} from '~/components/Money';
import {ResponsiveImage} from '~/components/ResponsiveImage';
import {ProductInSitu} from '~/components/ProductInSitu';
import {SealMark} from '~/components/SealMark';
import {UnderlineLink} from '~/components/UnderlineLink';
import {getProductByHandle, type ImageT} from '~/lib/mock-data';
import {PRODUCT_QUERY} from '~/lib/queries';
import {toProduct} from '~/lib/adapters';
import {groupProductMedia} from '~/lib/product-media';
import {usesMockData} from '~/lib/storefront';
import {routeMeta, productSeo} from '~/lib/seo';

export const meta: Route.MetaFunction = ({data, matches}) =>
  routeMeta(matches, data?.seo, 'product');

export async function loader({params, context, request}: Route.LoaderArgs) {
  const {handle} = params;
  if (!handle) throw new Response('Not found', {status: 404});

  if (usesMockData(context.env)) {
    const product = getProductByHandle(handle);
    if (!product) throw new Response('Not found', {status: 404});
    return data({product, seo: productSeo(product, request, context.env)});
  }

  const {product} = await context.storefront.query(PRODUCT_QUERY, {
    variables: {handle},
  });
  if (!product) throw new Response('Not found', {status: 404});
  const adapted = toProduct(product);
  return data({product: adapted, seo: productSeo(adapted, request, context.env)});
}

export default function ProductPage() {
  const {product} = useLoaderData<typeof loader>();

  // Lifestyle shots move to their own section; the carousel keeps the studio
  // front/back shots plus the fabric swatches, which are material information a
  // buyer wants next to the product.
  const media = useMemo(() => groupProductMedia(product), [product]);
  const carouselImages = media.carousel;

  const [activeImage, setActiveImage] = useState(0);
  // Undefined when the product has no photographs at all — the frame below
  // renders empty rather than reaching for a stand-in image.
  const image: ImageT | undefined =
    carouselImages[activeImage] ?? carouselImages[0];

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

  // When the chosen variant has its own image, jump the main image to it.
  // `activeImage` indexes `carouselImages`, so the lookup must use that same
  // array — not `product.images`. A variant image that isn't in the carousel
  // (index -1) leaves the current image alone.
  const variantImageId = variant?.image?.id;
  useEffect(() => {
    if (!variantImageId) return;
    const idx = carouselImages.findIndex((img) => img.id === variantImageId);
    if (idx >= 0) setActiveImage(idx);
  }, [variantImageId, carouselImages]);

  // The spec comes from `custom.*` product metafields, with sensible fallbacks
  // so the record is never empty.
  const d = product.details;
  const objectRecord: {label: string; value: string}[] = [
    {label: 'Front fabric', value: d?.frontFabric ?? 'Deadstock fabric'},
    {label: 'Back fabric', value: d?.backFabric ?? '—'},
    {label: 'Trim', value: d?.trim ?? '—'},
    {label: 'Insert', value: d?.insert ?? 'Duck feather, included'},
    {label: 'Care', value: d?.care ?? 'Spot clean recommended'},
  ];

  return (
    <>
      <Container className="section-y">
        <div className="mb-12">
          <UnderlineLink
            to="/collections"
            className="eyebrow text-ash hover:text-ink"
          >
            ← Back to the collection
          </UnderlineLink>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          <div className="lg:col-span-7">
            <figure className="aspect-[4/5] bg-bone overflow-hidden">
              {image ? (
                /* 7 of 12 columns with `lg:gap-20` (80px) gutters: the slot is
                   (7W - 5*80px)/12 of the container's content width W, which
                   for W = 100vw - 112px simplifies to 58.33vw - 99px. */
                <ResponsiveImage
                  src={image.url}
                  alt={image.altText ?? product.title}
                  aspectRatio="4/5"
                  sizes="(min-width: 1320px) 672px, (min-width: 1024px) calc(58.33vw - 99px), calc(100vw - 48px)"
                  priority
                  className="w-full h-full object-cover image-grade"
                />
              ) : null}
            </figure>
            {carouselImages.length > 1 ? (
              <div className="mt-4 flex flex-wrap gap-3">
                {carouselImages.map((img, i) => (
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
                    {/* Fixed 80px square (`w-20`), so this gets 1x/2x/3x
                        descriptors rather than a `sizes` list. */}
                    <ResponsiveImage
                      src={img.url}
                      alt=""
                      width={80}
                      height={80}
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

            {product.descriptionHtml ? (
              <div
                className="mt-8 text-ash text-[14px] leading-[1.7] font-light max-w-md space-y-4"
                dangerouslySetInnerHTML={{__html: product.descriptionHtml}}
              />
            ) : (
              <p className="mt-8 text-ash text-[14px] leading-[1.7] font-light max-w-md">
                {product.description}
              </p>
            )}

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
                {(fetcher) => {
                  const adding = fetcher.state !== 'idle';
                  const errorMessage: string | undefined =
                    fetcher.data?.errors?.[0]?.message;
                  const added =
                    !adding && Boolean(fetcher.data?.cart) && !errorMessage;
                  return (
                    <>
                      <button
                        type="submit"
                        disabled={!variant?.availableForSale || adding}
                        className="arrow-link text-ink disabled:opacity-50"
                      >
                        <span>
                          {adding
                            ? 'Adding…'
                            : variant?.availableForSale
                              ? 'Add to cart'
                              : 'Sold out'}
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
                      {errorMessage ? (
                        <p className="caption mt-5 text-stone" role="alert">
                          {errorMessage}
                        </p>
                      ) : added ? (
                        <p className="caption mt-5 text-ash">
                          Added —{' '}
                          <UnderlineLink
                            to="/cart"
                            staticUnderline
                            className="text-ash hover:text-ink"
                          >
                            view cart
                          </UnderlineLink>
                        </p>
                      ) : null}
                    </>
                  );
                }}
              </CartForm>
            </div>

            <p className="caption mt-8 text-stone max-w-md">
              Cut and sewn in small batches in Amsterdam from deadstock fabric —
              once a fabric is gone, that design won&rsquo;t be made again.
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

      {/* Lifestyle photography, split out of the carousel by
          ~/lib/product-media. Renders nothing when there is none. */}
      <ProductInSitu images={media.inSitu} productTitle={product.title} />
    </>
  );
}
