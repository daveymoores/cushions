import {useLoaderData} from 'react-router';
import type {Route} from './+types/atelier';
import {StubPage} from '~/components/StubPage';
import {Container} from '~/components/Container';
import {Eyebrow} from '~/components/Eyebrow';
import {SealMark} from '~/components/SealMark';
import {PAGE_QUERY} from '~/lib/queries';
import {usesMockData} from '~/lib/storefront';
import {routeMeta, pageSeo, basicSeo} from '~/lib/seo';

export const meta: Route.MetaFunction = ({data, matches}) =>
  routeMeta(matches, data?.seo);

/**
 * Editorial content for this page is pulled from a Shopify "Page" with the
 * handle `atelier` (Online Store → Pages). Edit the copy in Shopify admin and
 * it updates here — no code change. If the page doesn't exist yet, we fall back
 * to the built-in placeholder below.
 */
export async function loader({context, request}: Route.LoaderArgs) {
  const fallbackSeo = basicSeo({
    title: 'The Atelier',
    description:
      'A small homeware studio in Amsterdam, making cushions from deadstock fabric — cut, sewn and finished by hand in small batches.',
    request,
    env: context.env,
  });

  if (usesMockData(context.env)) return {page: null, seo: fallbackSeo};

  const {page} = await context.storefront.query(PAGE_QUERY, {
    variables: {handle: 'atelier'},
  });
  return {page, seo: page ? pageSeo(page, request, context.env) : fallbackSeo};
}

export default function Atelier() {
  const {page} = useLoaderData<typeof loader>();

  if (!page) {
    // Fallback copy until an `atelier` Page is created in Shopify admin.
    return (
      <StubPage
        eyebrow="By Appointment"
        title={
          <>
            The <span className="italic-stone">atelier</span>
          </>
        }
        body="A small homeware studio in Amsterdam, making cushions from deadstock fabric — surplus rolls from the interiors industry, cut and sewn in small batches and finished by hand."
      />
    );
  }

  return (
    <section className="section-y bg-paper">
      <Container>
        <div className="max-w-2xl">
          <SealMark size={14} className="text-ink/70 mb-6" />
          <Eyebrow className="block mb-5">By Appointment</Eyebrow>
          <h1 className="display-h1 text-ink">{page.title}</h1>
          <div
            className="prose-editorial mt-8 text-ash text-[14px] leading-[1.7] font-light"
            // Page body is trusted rich-text authored in your own Shopify admin.
            dangerouslySetInnerHTML={{__html: page.body}}
          />
        </div>
      </Container>
    </section>
  );
}
