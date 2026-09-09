import {useLoaderData} from 'react-router';
import type {Route} from './+types/materials';
import {Container} from '~/components/Container';
import {Eyebrow} from '~/components/Eyebrow';
import {ResponsiveImage} from '~/components/ResponsiveImage';
import {METAOBJECTS_QUERY, PAGE_QUERY} from '~/lib/queries';
import {toMaterial} from '~/lib/metaobject';
import {usesMockData} from '~/lib/storefront';
import {routeMeta, pageSeo, basicSeo} from '~/lib/seo';

export const meta: Route.MetaFunction = ({data, matches}) =>
  routeMeta(matches, data?.seo);

/**
 * Example of custom content via Metaobjects. Reads all metaobjects of type
 * `material` (Settings → Custom data → Metaobjects → define `material` with
 * fields: name, description, and an optional image). Each entry you add in
 * admin appears here automatically.
 *
 * The intro above the grid is pulled from a Shopify "Page" with the handle
 * `fabrics` (Online Store → Pages). Edit the copy in Shopify admin and it
 * updates here — no code change. If the page doesn't exist yet, we fall back to
 * the built-in intro below; a missing or failing page never takes the grid
 * with it.
 */
export async function loader({context, request}: Route.LoaderArgs) {
  const fallbackSeo = basicSeo({
    title: 'Fabrics',
    description:
      'The deadstock fabrics behind each cushion — upholstery jacquards, ribbed velvets and woven geometrics, rescued from designer surplus.',
    request,
    env: context.env,
  });

  if (usesMockData(context.env))
    return {materials: [], page: null, seo: fallbackSeo};

  const [{metaobjects}, page] = await Promise.all([
    context.storefront.query(METAOBJECTS_QUERY, {
      variables: {type: 'material', first: 24},
    }),
    context.storefront
      .query(PAGE_QUERY, {variables: {handle: 'fabrics'}})
      .then((result) => result.page)
      .catch(() => null),
  ]);

  return {
    materials: metaobjects.nodes.map(toMaterial),
    page,
    seo: page ? pageSeo(page, request, context.env) : fallbackSeo,
  };
}

/** Built-in intro heading, shown until a `fabrics` Page is created in admin. */
function FallbackIntro() {
  return (
    <h1 className="display-h1 text-ink">
      The <span className="italic-stone">cloths</span> we work
    </h1>
  );
}

export default function Materials() {
  const {materials, page} = useLoaderData<typeof loader>();

  return (
    <section className="section-y bg-paper">
      <Container>
        <div className="max-w-xl mb-14">
          <Eyebrow className="block mb-5">On Material</Eyebrow>
          {page ? (
            <>
              <h1 className="display-h1 text-ink">{page.title}</h1>
              {page.body ? (
                <div
                  className="prose-editorial mt-8 text-ash text-[14px] leading-[1.7] font-light"
                  // Page body is trusted rich-text authored in your own Shopify admin.
                  dangerouslySetInnerHTML={{__html: page.body}}
                />
              ) : null}
            </>
          ) : (
            <FallbackIntro />
          )}
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
                    {/* 1 col, 2 from lg with `lg:gap-16` (64px) gutters. */}
                    <ResponsiveImage
                      src={m.image.url}
                      alt={m.image.altText ?? m.name}
                      aspectRatio="4/3"
                      sizes="(min-width: 1320px) 572px, (min-width: 1024px) calc((100vw - 176px) / 2), calc(100vw - 48px)"
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
