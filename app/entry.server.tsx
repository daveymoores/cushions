import {ServerRouter} from 'react-router';
import {isbot} from 'isbot';
import {renderToReadableStream} from 'react-dom/server';
import {
  createContentSecurityPolicy,
  type HydrogenRouterContextProvider,
} from '@shopify/hydrogen';
import type {EntryContext} from 'react-router';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  context: HydrogenRouterContextProvider,
) {
  const {nonce, header, NonceProvider} = createContentSecurityPolicy({
    shop: {
      checkoutDomain: context.env.PUBLIC_CHECKOUT_DOMAIN,
      storeDomain: context.env.PUBLIC_STORE_DOMAIN,
    },
    // NOTE on how these overrides combine with Hydrogen's defaults:
    //   - `defaultSrc`, `connectSrc`, `styleSrc`, `baseUri` and `frameAncestors`
    //     are MERGED with Hydrogen's defaults (see `addCspDirective` in
    //     @shopify/hydrogen), so nothing listed here can knock out the Shopify
    //     CDN, the shop domains, or the dev-only localhost/websocket entries.
    //   - `imgSrc` and `fontSrc` have no Hydrogen default, so what's listed
    //     here is the whole directive.
    // We deliberately do NOT set `scriptSrc`: Hydrogen has no default for it,
    // so declaring one would stop scripts falling back to `defaultSrc` and
    // silently drop cdn.shopify.com (and localhost in dev). Script hosts are
    // added to `defaultSrc` instead.
    imgSrc: [
      "'self'",
      'data:',
      'https://cdn.shopify.com',
      'https://shopify.com',
      'https://images.unsplash.com',
    ],
    // eu-assets.i.posthog.com serves posthog-js's lazily loaded extension
    // bundles (session recorder, surveys, toolbar) — they're <script> loads,
    // hence defaultSrc; eu.i.posthog.com is the event ingest endpoint.
    defaultSrc: ['https://eu-assets.i.posthog.com'],
    connectSrc: [
      "'self'",
      'https://cdn.shopify.com',
      'https://images.unsplash.com',
      'https://eu.i.posthog.com',
      'https://eu-assets.i.posthog.com',
    ],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    // cdn.shopify.com is required: on Oxygen the built CSS is served from the
    // Shopify CDN, so its @font-face `url()` resolves there too. Without this
    // the self-hosted wordmark font is blocked and silently falls back to
    // Georgia — `fetch()` still succeeds, because that is connectSrc's call.
    fontSrc: [
      "'self'",
      'data:',
      'https://cdn.shopify.com',
      'https://fonts.gstatic.com',
    ],
  });

  const body = await renderToReadableStream(
    <NonceProvider>
      <ServerRouter
        context={reactRouterContext}
        url={request.url}
        nonce={nonce}
      />
    </NonceProvider>,
    {
      nonce,
      signal: request.signal,
      onError(error) {
        console.error(error);
        responseStatusCode = 500;
      },
    },
  );

  if (isbot(request.headers.get('user-agent'))) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  responseHeaders.set('Content-Security-Policy', header);

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
