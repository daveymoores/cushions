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
  }
}
