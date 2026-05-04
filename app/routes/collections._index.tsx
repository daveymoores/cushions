import {useLoaderData, data} from 'react-router';
import type {Route} from './+types/collections._index';
import {Container} from '~/components/Container';
import {Eyebrow} from '~/components/Eyebrow';
import {CollectionCard} from '~/components/CollectionCard';
import {collections} from '~/lib/mock-data';

const USE_MOCK_DATA = true;

export const meta: Route.MetaFunction = () => {
  return [{title: 'Collections — Maison Lévantine'}];
};

export async function loader(_args: Route.LoaderArgs) {
  if (USE_MOCK_DATA) {
    return data({collections});
  }

  // Real Shopify path:
  // const {storefront} = _args.context;
  // const {collections: result} = await storefront.query(COLLECTIONS_QUERY);
  // return data({collections: result.nodes});

  throw new Error('USE_MOCK_DATA is false but no real loader is wired up.');
}

export default function CollectionsIndex() {
  const {collections: cols} = useLoaderData<typeof loader>();

  return (
    <section className="section-y bg-cream">
      <Container>
        <div className="text-center max-w-xl mx-auto mb-20">
          <Eyebrow className="block mb-8">By Material</Eyebrow>
          <h1 className="font-serif font-light text-[52px] sm:text-[64px] leading-[0.95] tracking-[-0.02em]">
            Collections
          </h1>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-14 gap-x-8">
          {cols.map((c) => (
            <CollectionCard key={c.id} collection={c} />
          ))}
        </div>
      </Container>
    </section>
  );
}
