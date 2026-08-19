import {useLoaderData, data, redirect} from 'react-router';
import type {Route} from './+types/pages.$handle';
import {Container} from '~/components/Container';
import {Eyebrow} from '~/components/Eyebrow';
import {SealMark} from '~/components/SealMark';
import {PAGE_QUERY} from '~/lib/queries';
import {usesMockData} from '~/lib/storefront';
import {routeMeta, pageSeo} from '~/lib/seo';

export const meta: Route.MetaFunction = ({data, matches}) =>
  routeMeta(matches, data?.seo);

/**
 * Page handles that have a hand-built route of their own. `/pages/<handle>`
 * 301s to it so the same content never lives at two indexable URLs.
 */
const RESERVED_HANDLES: Record<string, string> = {
  atelier: '/atelier',
};

/**
 * Generic Shopify Page renderer. Any Page created in admin (Online Store →
 * Pages) is reachable at /pages/<handle> with zero code — e.g. a page with
 * handle `shipping` shows at /pages/shipping.
 */
export async function loader({params, context, request}: Route.LoaderArgs) {
  const {handle} = params;
  if (!handle) throw new Response('Not found', {status: 404});

  // Handles that also have a bespoke route would otherwise serve the same
  // content at two self-canonicalising URLs. Send the generic one to the
  // bespoke one permanently. Must run before the mock-data 404 below.
  const reserved = RESERVED_HANDLES[handle];
  if (reserved) throw redirect(reserved, 301);

  if (usesMockData(context.env)) throw new Response('Not found', {status: 404});

  const {page} = await context.storefront.query(PAGE_QUERY, {
    variables: {handle},
  });
  if (!page) throw new Response('Not found', {status: 404});
  return data({page, seo: pageSeo(page, request, context.env)});
}

export default function Page() {
  const {page} = useLoaderData<typeof loader>();

  return (
    <section className="section-y bg-paper">
      <Container>
        <div className="max-w-2xl">
          <SealMark size={14} className="text-ink/70 mb-6" />
          <Eyebrow className="block mb-5">Sisu</Eyebrow>
          <h1 className="display-h1 text-ink">{page.title}</h1>
          <div
            className="prose-editorial mt-8 text-ash text-[14px] leading-[1.7] font-light"
            dangerouslySetInnerHTML={{__html: page.body}}
          />
        </div>
      </Container>
    </section>
  );
}
