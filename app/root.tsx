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
      href: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Inter:wght@300;400;500&display=swap',
    },
    {rel: 'preconnect', href: 'https://images.unsplash.com'},
    {rel: 'icon', type: 'image/svg+xml', href: favicon},
  ];
}

export async function loader(_args: Route.LoaderArgs) {
  // Mock-data phase: nothing to fetch at the root. Once a real Shopify store is
  // connected, fetch the menu/footer queries here and return them.
  return {};
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
      <body className="bg-cream text-ink">
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
      <h1 className="font-serif font-light text-[56px] mt-6 leading-[0.95]">
        Something has come undone.
      </h1>
      {isDev && errorMessage ? (
        <pre className="mt-8 text-stone text-[13px] whitespace-pre-wrap">
          {errorMessage}
        </pre>
      ) : null}
    </div>
  );
}
