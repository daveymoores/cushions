/// <reference types="vite/client" />
/// <reference types="react-router" />
/// <reference types="@shopify/oxygen-workers-types" />
/// <reference types="@shopify/hydrogen/react-router-types" />

// Enhance TypeScript's built-in typings.
import '@total-typescript/ts-reset';

declare global {
  /**
   * Hydrogen declares `interface Env extends HydrogenEnv` globally (see
   * `@shopify/hydrogen/react-router-types`). Interface merging lets us add the
   * project-specific variables on top. Both are optional: with no PostHog key
   * the analytics client simply never initialises.
   */
  interface Env {
    PUBLIC_POSTHOG_KEY?: string;
    PUBLIC_POSTHOG_HOST?: string;
    /**
     * Canonical public origin, e.g. `https://sisuhomeware.com` (no trailing
     * slash). Pins canonicals, JSON-LD `url`, the sitemap and robots.txt to one
     * host so the Oxygen preview domain never self-canonicalises as a duplicate
     * site. Falls back to the request origin when unset — see `siteOrigin()`.
     */
    PUBLIC_SITE_URL?: string;
  }
}
