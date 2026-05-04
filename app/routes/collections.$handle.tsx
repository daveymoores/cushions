import {useLoaderData, data} from 'react-router';
import type {Route} from './+types/collections.$handle';
import {Container} from '~/components/Container';
import {Eyebrow} from '~/components/Eyebrow';
import {ProductCard} from '~/components/ProductCard';
import {getCollectionByHandle} from '~/lib/mock-data';

const USE_MOCK_DATA = true;

export const meta: Route.MetaFunction = ({data: routeData}) => {
  const title = routeData?.collection?.title ?? 'Collection';
  return [{title: `${title} — Maison Lévantine`}];
};

export async function loader({params}: Route.LoaderArgs) {
  const {handle} = params;
  if (!handle) throw new Response('Not found', {status: 404});

  if (USE_MOCK_DATA) {
    const collection = getCollectionByHandle(handle);
    if (!collection) throw new Response('Not found', {status: 404});
    return data({collection});
  }

  // Real Shopify path:
  // const {storefront} = _args.context;
  // const {collection} = await storefront.query(COLLECTION_QUERY, {variables: {handle}});
  // if (!collection) throw new Response('Not found', {status: 404});
  // return data({collection});

  throw new Error('USE_MOCK_DATA is false but no real loader is wired up.');
}

export default function CollectionPage() {
  const {collection} = useLoaderData<typeof loader>();

  return (
    <>
      <section className="section-y bg-cream">
        <Container>
          <div className="max-w-2xl">
            <Eyebrow className="block mb-8">Collection</Eyebrow>
            <h1 className="font-serif font-light text-[52px] sm:text-[72px] leading-[0.95] tracking-[-0.02em]">
              {collection.title}
            </h1>
            <p className="mt-8 text-stone text-[15px] leading-relaxed font-light max-w-md">
              {collection.description}
            </p>
          </div>
        </Container>
      </section>

      <section className="bg-cream pb-32">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-10">
            {collection.products.nodes.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
