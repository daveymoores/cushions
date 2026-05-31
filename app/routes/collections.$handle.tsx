import {useLoaderData, data} from 'react-router';
import type {Route} from './+types/collections.$handle';
import {Container} from '~/components/Container';
import {Eyebrow} from '~/components/Eyebrow';
import {ProductCard} from '~/components/ProductCard';
import {getCollectionByHandle} from '~/lib/mock-data';
import {COLLECTION_QUERY} from '~/lib/queries';
import {toCollection} from '~/lib/adapters';
import {usesMockData} from '~/lib/storefront';
import {routeMeta, collectionSeo} from '~/lib/seo';

export const meta: Route.MetaFunction = ({data, matches}) =>
  routeMeta(matches, data?.seo);

export async function loader({params, context, request}: Route.LoaderArgs) {
  const {handle} = params;
  if (!handle) throw new Response('Not found', {status: 404});

  if (usesMockData(context.env)) {
    const collection = getCollectionByHandle(handle);
    if (!collection) throw new Response('Not found', {status: 404});
    return data({collection, seo: collectionSeo(collection, request)});
  }

  const {collection} = await context.storefront.query(COLLECTION_QUERY, {
    variables: {handle, first: 24},
  });
  if (!collection) throw new Response('Not found', {status: 404});
  const adapted = toCollection(collection);
  return data({collection: adapted, seo: collectionSeo(adapted, request)});
}

export default function CollectionPage() {
  const {collection} = useLoaderData<typeof loader>();

  return (
    <>
      <section className="section-y bg-paper">
        <Container>
          <div className="max-w-2xl">
            <Eyebrow className="block mb-5">Collection</Eyebrow>
            <h1 className="display-h1 text-ink">{collection.title}</h1>
            <p className="mt-7 text-ash text-[14px] leading-[1.7] font-light max-w-md">
              {collection.description}
            </p>
          </div>
        </Container>
      </section>

      <section className="bg-paper pb-32">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-14 gap-x-10">
            {collection.products.nodes.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
