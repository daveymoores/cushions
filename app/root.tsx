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
import sophilliaFont from '~/assets/fonts/sophillia-regular.woff2';
import appStyles from '~/styles/app.css?url';
import {PageLayout} from './components/PageLayout';
import {NotFound} from './components/NotFound';
import {PostHogAnalytics} from './components/PostHogAnalytics';
import {
  MENUS_QUERY,
  NAV_COLLECTIONS_QUERY,
  SITE_CONTENT_QUERY,
} from '~/lib/queries';
import {toNavColumns, toNavLinks} from '~/lib/nav';
import {FALLBACK_SOCIAL_LINKS, toSocialLinks} from '~/lib/social';
import {usesMockData} from '~/lib/storefront';
import {collections} from '~/lib/mock-data';
import {NOT_FOUND_TITLE, rootSeo, routeMeta} from '~/lib/seo';
import {toSiteContent, type SiteContent} from '~/lib/content';
import {isVisibleCollection} from '~/lib/adapters';

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

/**
 * Earns its keep only when the root `ErrorBoundary` renders. React Router runs
 * `meta` for the routes down to the one whose boundary caught the error and no
 * further, so a 404 thrown by a child loader (`/products/<unknown>`,
 * `/collections/all`, an unknown `/pages/x`) never reaches the child's own
 * `meta` — this is the only place that page's tags can come from. It gets what
 * the catch-all route (`$.tsx`) gets: the same title, a canonical to the
 * requested path, and `noindex,follow`.
 *
 * Runs in the browser too, so no `env`: the canonical is built from the site
 * origin the root loader already baked into `seo.url`.
 *
 * Anything else returns nothing, as before this existed: every page route's
 * `meta` replaces its parent's and merges the root config itself, so building
 * the site defaults here would be thrown away on every normal render.
 */
export const meta: Route.MetaFunction = ({data, error, location, matches}) => {
  if (!isRouteErrorResponse(error) || error.status !== 404) return [];
  const site = data?.seo.url;
  return routeMeta(matches, {
    title: NOT_FOUND_TITLE,
    url: site ? site + location.pathname : undefined,
    robots: {noIndex: true, noFollow: false},
  });
};

export function links() {
  return [
    // The wordmark is above the fold on every page, so the self-hosted
    // Sophillia face is preloaded to avoid a swap flash on the logo.
    {
      rel: 'preload',
      as: 'font',
      type: 'font/woff2',
      href: sophilliaFont,
      crossOrigin: 'anonymous' as const,
    },
    {rel: 'preconnect', href: 'https://fonts.googleapis.com'},
    {
      rel: 'preconnect',
      href: 'https://fonts.gstatic.com',
      crossOrigin: 'anonymous' as const,
    },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..500&family=Hanken+Grotesk:wght@300;400;500;600&display=swap',
    },
    {rel: 'preconnect', href: 'https://images.unsplash.com'},
    {rel: 'icon', type: 'image/svg+xml', href: favicon},
  ];
}

export async function loader({context, request}: Route.LoaderArgs) {
  // The cart + collection nav are needed app-wide (header/footer on every page).
  // Awaited here so the header can render synchronously without Suspense.
  const cart = await context.cart.get();
  const emptyContent: SiteContent = {};

  // Only these two env vars are forwarded to the browser — never spread
  // `context.env`, which holds SESSION_SECRET and the API tokens.
  const posthog = {
    key: context.env.PUBLIC_POSTHOG_KEY ?? '',
    host: context.env.PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com',
  };

  if (usesMockData(context.env)) {
    return {
      cart,
      seo: rootSeo(
        request,
        context.env,
        undefined,
        FALLBACK_SOCIAL_LINKS.map((link) => link.to),
      ),
      posthog,
      content: emptyContent,
      collections: collections.map((c) => ({
        id: c.id,
        handle: c.handle,
        title: c.title,
      })),
      // No Shopify menus without a real store; header and footer use their
      // fallbacks.
      menu: [],
      footerMenu: [],
      socialLinks: FALLBACK_SOCIAL_LINKS,
    };
  }

  const [navResult, contentResult, menuResult] = await Promise.all([
    context.storefront.query(NAV_COLLECTIONS_QUERY, {variables: {first: 8}}),
    // Short cache so edits to the homepage metaobject appear within ~seconds.
    context.storefront.query(SITE_CONTENT_QUERY, {
      cache: context.storefront.CacheShort(),
    }),
    // Header and footer nav are both merchant-editable, so neither must be able
    // to take the page down: on any failure each falls back to its hardcoded
    // links. One aliased query for both menus, so the nav costs one round trip.
    // Short cache, so a navigation edit shows up within ~seconds like content.
    context.storefront
      .query(MENUS_QUERY, {
        variables: {
          mainHandle: 'main-menu',
          footerHandle: 'footer',
          socialHandle: 'social',
        },
        cache: context.storefront.CacheShort(),
      })
      .catch(() => null),
  ]);
  const content = toSiteContent(contentResult);
  // Resolved once here because two consumers must agree on it: the footer's
  // icon row and the Organization's `sameAs`.
  const menuSocialLinks = toSocialLinks(
    menuResult?.social,
    menuResult?.shop.primaryDomain.url,
    context.env,
  );
  const socialLinks =
    menuSocialLinks.length > 0 ? menuSocialLinks : FALLBACK_SOCIAL_LINKS;
  return {
    cart,
    // The homepage hero doubles as the site-wide Open Graph image: routes that
    // set their own `media` (products, collections, articles) override it.
    seo: rootSeo(
      request,
      context.env,
      content.heroImage,
      socialLinks.map((link) => link.to),
    ),
    posthog,
    content,
    collections: navResult.collections.nodes.filter(isVisibleCollection),
    menu: toNavLinks(
      menuResult?.main,
      menuResult?.shop.primaryDomain.url,
      context.env,
    ),
    // Nested only: a top-level item with no children isn't a footer column, so
    // a flat `footer` menu yields none and the Footer uses its own columns.
    footerMenu: toNavColumns(
      menuResult?.footer,
      menuResult?.shop.primaryDomain.url,
      context.env,
    ),
    socialLinks,
  };
}

export function Layout({children}: {children?: React.ReactNode}) {
  const nonce = useNonce();

  return (
    <html lang="en-GB">
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
    <>
      <PostHogAnalytics />
      <PageLayout>
        <Outlet />
      </PageLayout>
    </>
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

  // A 404 thrown by a loader (`/pages/<unknown>`, a collection that isn't
  // published) is a wrong turn, not a failure, so it gets the full site chrome
  // and the same page the catch-all route renders. Its title and noindex come
  // from the root `meta` above.
  //
  // Only 404s. An unexpected error might *be* the layout failing — a Header
  // render bug, or a root loader that never returned — and re-rendering
  // `PageLayout` here would throw a second time inside the boundary, leaving
  // React Router's unstyled default. Everything else keeps the bare fallback
  // below, which depends on nothing but the stylesheet.
  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <PageLayout>
        <NotFound />
      </PageLayout>
    );
  }

  return (
    <div className="container-page section-y">
      <p className="eyebrow">Error {errorStatus}</p>
      <h1 className="font-display italic text-[28px] mt-8 leading-[1.1] text-ink">
        Something went wrong at our end.
      </h1>
      <p className="mt-7 text-ash text-[14px] leading-[1.7] font-light max-w-md">
        A fault on our side, not a page that’s missing. Trying again often
        settles it.
      </p>
      <a
        href="/"
        className="underline-link is-static eyebrow text-ink/85 mt-8 inline-block"
      >
        Back to the homepage
      </a>
      {isDev && errorMessage ? (
        <pre className="mt-8 text-ash text-[12px] whitespace-pre-wrap font-body">
          {errorMessage}
        </pre>
      ) : null}
    </div>
  );
}
