import {useLoaderData, data} from 'react-router';
import type {Route} from './+types/collections._index';
import {Container} from '~/components/Container';
import {Eyebrow} from '~/components/Eyebrow';
import {CollectionCard} from '~/components/CollectionCard';
import {collections} from '~/lib/mock-data';
import {COLLECTIONS_QUERY} from '~/lib/queries';
import {toCollectionCard} from '~/lib/adapters';
import {usesMockData} from '~/lib/storefront';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Collections — Sisu'}];
};

export async function loader({context}: Route.LoaderArgs) {
  if (usesMockData(context.env)) {
    return data({collections});
  }

  const {collections: result} = await context.storefront.query(
    COLLECTIONS_QUERY,
    {variables: {first: 24}},
  );
  return data({collections: result.nodes.map(toCollectionCard)});
}

export default function CollectionsIndex() {
  const {collections: cols} = useLoaderData<typeof loader>();

  return (
    <section className="section-y bg-paper">
      <Container>
        <div className="max-w-xl mb-14">
          <Eyebrow className="block mb-5">By Material</Eyebrow>
          <h1 className="display-h1 text-ink">Collections</h1>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-6">
          {cols.map((c) => (
            <CollectionCard key={c.id} collection={c} />
          ))}
        </div>
      </Container>
    </section>
  );
}
