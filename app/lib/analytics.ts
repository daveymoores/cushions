import type {CaptureOptions, PostHog} from 'posthog-js';

/**
 * Funnel analytics: the three shop events PostHog can't infer from pageviews.
 *
 * posthog-js is loaded with a dynamic import in `PostHogAnalytics.tsx`, so it
 * isn't available synchronously here (and must never be statically imported,
 * which would pull it into the hydration path and the server bundle). The
 * bootstrap hands the initialised client over through `connectAnalytics`.
 *
 * Events tracked before that happens are held in a small queue: the product
 * page's mount effect runs before PostHog has finished loading, and dropping it
 * would lose the first product view of every landing. Without a PostHog key
 * nothing ever connects, so `track` is a no-op beyond that bounded queue.
 */
export type AnalyticsEvents = {
  product_viewed: {
    handle: string;
    product_id: string;
    variant_id: string;
    price: number;
    currency: string;
    title: string;
  };
  add_to_cart: {
    handle: string;
    variant_id: string;
    quantity: number;
    price: number;
    currency: string;
  };
  checkout_started: {
    cart_total: number;
    currency: string;
    line_count: number;
  };
};

type AnalyticsEvent = keyof AnalyticsEvents;

/**
 * The slice of posthog-js used here. Structural, so both the default export
 * and the instance handed to `loaded` (typed `PostHogInterface`) fit.
 */
type AnalyticsClient = Pick<
  PostHog,
  | 'capture'
  | 'opt_out_capturing'
  | 'opt_in_capturing'
  | 'has_opted_out_capturing'
>;

type Pending = {
  event: AnalyticsEvent;
  props: AnalyticsEvents[AnalyticsEvent];
  options?: CaptureOptions;
};

const MAX_PENDING = 20;

let client: AnalyticsClient | null = null;
const pending: Pending[] = [];

export function track<E extends AnalyticsEvent>(
  event: E,
  props: AnalyticsEvents[E],
  options?: CaptureOptions,
) {
  if (typeof window === 'undefined') return;
  if (client) {
    // Analytics must never break the page it is measuring.
    try {
      client.capture(event, props, options);
    } catch {
      // A failed capture is a missing data point, not a page error.
    }
  } else if (pending.length < MAX_PENDING) {
    pending.push({event, props, options});
  }
}

/** Called once from the PostHog bootstrap's `loaded` callback. */
export function connectAnalytics(posthog: AnalyticsClient) {
  client = posthog;
  for (const {event, props, options} of pending.splice(0)) {
    posthog.capture(event, props, options);
  }
}

/**
 * Internal-visitor opt-out. `?internal=1` on any URL stops this browser
 * capturing (posthog-js persists the choice in localStorage); `?internal=0`
 * turns it back on. Nothing is shown in the UI.
 */
export function applyInternalFlag(posthog: AnalyticsClient, search: string) {
  const flag = new URLSearchParams(search).get('internal');
  if (flag === '1' && !posthog.has_opted_out_capturing()) {
    posthog.opt_out_capturing();
  } else if (flag === '0' && posthog.has_opted_out_capturing()) {
    // No `$opt_in` event: it would be one more internal event in the data.
    posthog.opt_in_capturing({captureEventName: false});
  }
}

/** The connected client, for the bootstrap's location effect. */
export function getAnalyticsClient(): AnalyticsClient | null {
  return client;
}
