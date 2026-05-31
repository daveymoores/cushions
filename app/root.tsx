import {useNonce} from '@shopify/hydrogen';
import {
  Outlet,
  useRouteError,
  isRouteErrorResponse,
  type ShouldRevalidateFunction,
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
} from 'react-router';
import type {Route} from './+types/root';
import favicon from '~/assets/favicon.svg';
import appStyles from '~/styles/app.css?url';
import {PageLayout} from './components/PageLayout';
import {NAV_COLLECTIONS_QUERY, SITE_CONTENT_QUERY} from '~/lib/queries';
import {usesMockData} from '~/lib/storefront';
import {collections} from '~/lib/mock-data';
import {rootSeo} from '~/lib/seo';
import {toSiteContent, type SiteContent} from '~/lib/content';

export type RootLoader = typeof loader;

export const shouldRevalidate: ShouldRevalidateFunction = ({
  formMethod,
  currentUrl,
  nextUrl,
}) => {
  if (formMethod && formMethod !== 'GET') return true;
  if (currentUrl.toString() === nextUrl.toString()) return true;
  return false;
};

export function links() {
  return [
    {rel: 'preconnect', href: 'https://fonts.googleapis.com'},
    {
      rel: 'preconnect',
      href: 'https://fonts.gstatic.com',
      crossOrigin: 'anonymous' as const,
    },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..500&family=Cinzel:wght@400;500&family=Hanken+Grotesk:wght@300;400;500&display=swap',
    },
    {rel: 'preconnect', href: 'https://images.unsplash.com'},
    {rel: 'icon', type: 'image/svg+xml', href: favicon},
  ];
}

export async function loader({context, request}: Route.LoaderArgs) {
  // The cart + collection nav are needed app-wide (header/footer on every page).
  // Awaited here so the header can render synchronously without Suspense.
  const cart = await context.cart.get();
  const seo = rootSeo(request);
  const emptyContent: SiteContent = {};

  if (usesMockData(context.env)) {
    return {
      cart,
      seo,
      content: emptyContent,
      collections: collections.map((c) => ({
        id: c.id,
        handle: c.handle,
        title: c.title,
      })),
    };
  }

  const [navResult, contentResult] = await Promise.all([
    context.storefront.query(NAV_COLLECTIONS_QUERY, {variables: {first: 8}}),
    context.storefront.query(SITE_CONTENT_QUERY),
  ]);
  return {
    cart,
    seo,
    content: toSiteContent(contentResult),
    collections: navResult.collections.nodes,
  };
}

export function Layout({children}: {children?: React.ReactNode}) {
  const nonce = useNonce();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="stylesheet" href={appStyles} />
        <Meta />
        <Links />
      </head>
      <body className="bg-paper text-ink">
        {children}
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <PageLayout>
      <Outlet />
    </PageLayout>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const isDev = import.meta.env.DEV;
  let errorMessage = '';
  let errorStatus = 500;

  if (isRouteErrorResponse(error)) {
    errorStatus = error.status;
    errorMessage = error?.data?.message ?? error.data ?? '';
  } else if (error instanceof Error) {
    errorMessage = error.message;
    console.error(error);
  }

  return (
    <div className="container-page section-y">
      <p className="eyebrow">Error {errorStatus}</p>
      <h1 className="font-display italic text-[28px] mt-8 leading-[1.1] text-ink">
        Something has come undone.
      </h1>
      {isDev && errorMessage ? (
        <pre className="mt-8 text-ash text-[12px] whitespace-pre-wrap font-body">
          {errorMessage}
        </pre>
      ) : null}
    </div>
  );
}
