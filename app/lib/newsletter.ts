/**
 * Shared between the sign-up form (`~/components/Newsletter`) and its endpoint
 * (`app/routes/newsletter.tsx`). Kept out of the route file so the component
 * never imports a route module.
 */

/** Outcome the endpoint reports, as JSON or as `?newsletter=` on redirect. */
export type NewsletterStatus = 'subscribed' | 'invalid' | 'error';

/** Off-screen field a person never fills; a bot filling every input does. */
export const HONEYPOT_FIELD = 'company';

/** Reads `?newsletter=` back into a status; anything unknown is ignored. */
export function parseNewsletterStatus(
  value: string | null,
): NewsletterStatus | undefined {
  return value === 'subscribed' || value === 'invalid' || value === 'error'
    ? value
    : undefined;
}
