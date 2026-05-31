import {useLoaderData} from 'react-router';
import type {Route} from './+types/materials';
import {Container} from '~/components/Container';
import {Eyebrow} from '~/components/Eyebrow';
import {METAOBJECTS_QUERY} from '~/lib/queries';
import {toMaterial} from '~/lib/metaobject';
import {usesMockData} from '~/lib/storefront';

export const meta: Route.MetaFunction = () => [{title: 'Materials — Sisu'}];

/**
 * Example of custom content via Metaobjects. Reads all metaobjects of type
 * `material` (Settings → Custom data → Metaobjects → define `material` with
 * fields: name, description, and an optional image). Each entry you add in
 * admin appears here automatically.
 */
export async function loader({context}: Route.LoaderArgs) {
  if (usesMockData(context.env)) return {materials: []};

  const {metaobjects} = await context.storefront.query(METAOBJECTS_QUERY, {
    variables: {type: 'material', first: 24},
  });
  return {materials: metaobjects.nodes.map(toMaterial)};
}

export default function Materials() {
  const {materials} = useLoaderData<typeof loader>();

  return (
    <section className="section-y bg-paper">
      <Container>
        <div className="max-w-xl mb-14">
          <Eyebrow className="block mb-5">On Material</Eyebrow>
          <h1 className="display-h1 text-ink">
            The <span className="italic-stone">cloths</span> we work
          </h1>
        </div>

        {materials.length === 0 ? (
          <p className="text-ash text-[14px] leading-[1.7] font-light max-w-md">
            No materials yet. Create a <code>material</code> metaobject in Shopify
            admin (Settings → Custom data) and entries will appear here.
          </p>
        ) : (
          <div className="space-y-20">
            {materials.map((m, i) => (
              <div
                key={m.id}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center ${
                  i % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''
                }`}
              >
                {m.image ? (
                  <div className="aspect-[4/3] bg-bone overflow-hidden">
                    <img
                      src={m.image.url}
                      alt={m.image.altText ?? m.name}
                      loading="lazy"
                      className="w-full h-full object-cover image-grade"
                    />
                  </div>
                ) : (
                  <div className="aspect-[4/3] bg-bone" aria-hidden="true" />
                )}
                <div>
                  <h2 className="display-h2 text-ink">{m.name}</h2>
                  <p className="mt-5 text-ash text-[14px] leading-[1.7] font-light max-w-md">
                    {m.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
