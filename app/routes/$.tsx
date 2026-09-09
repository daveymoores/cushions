import {data} from 'react-router';
import type {Route} from './+types/$';
import {NotFound} from '~/components/NotFound';
import {routeMeta, basicSeo} from '~/lib/seo';

export const meta: Route.MetaFunction = ({data, matches}) =>
  routeMeta(matches, data?.seo);

/**
 * Catch-all for any path no other route claims. It matters that this is a real
 * route rather than an error: it renders inside `PageLayout` like every other
 * page, so a wrong turn still has a header, a footer and a way onward.
 *
 * The 404 status comes from the `data()` init — a plain return would serve the
 * page as a 200 and let it into the index. `noIndex` on top of that, because a
 * mis-typed menu link in admin can put a real, linkable URL here.
 *
 * A 404 leaving the app is also what makes Shopify's own URL redirects work:
 * `storefrontRedirect` in `server.ts` only consults them on a 404.
 */
export async function loader({context, request}: Route.LoaderArgs) {
  return data(
    {
      seo: basicSeo({
        title: 'Page not found',
        request,
        env: context.env,
        noIndex: true,
      }),
    },
    {status: 404},
  );
}

export default function CatchAll() {
  return <NotFound />;
}
