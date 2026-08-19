import {useEffect} from 'react';
import {useRouteLoaderData} from 'react-router';
import type {RootLoader} from '~/root';

/**
 * Client-side PostHog bootstrap.
 *
 * Rendered from `app/root.tsx`. The key/host come from the root loader (server
 * env → SSR payload) rather than `import.meta.env`, because Oxygen supplies
 * environment variables at request time, not at build time.
 *
 * If `PUBLIC_POSTHOG_KEY` is empty or missing, PostHog is never imported or
 * initialised — local dev without keys stays completely quiet.
 */
export function PostHogAnalytics() {
  const data = useRouteLoaderData<RootLoader>('root');
  const key = data?.posthog?.key;
  const host = data?.posthog?.host;

  useEffect(() => {
    if (!key) return;

    let cancelled = false;

    // Dynamic import keeps posthog-js out of the critical hydration path, and
    // out of the bundle graph entirely on the server.
    void import('posthog-js').then(({default: posthog}) => {
      // React StrictMode mounts effects twice in dev; posthog.init is not
      // idempotent, so guard on the library's own loaded flag.
      if (cancelled || posthog.__loaded) return;

      posthog.init(key, {
        api_host: host,
        defaults: '2025-05-24',
        // With `defaults: '2025-05-24'` this is already the default, but state
        // it explicitly: 'history_change' captures the initial pageview *and*
        // client-side route changes via the History API, so React Router
        // navigations are tracked without any manual capture() calls. Passing
        // `true` here would disable the History API listener.
        capture_pageview: 'history_change',
      });
    });

    return () => {
      cancelled = true;
    };
  }, [key, host]);

  return null;
}
