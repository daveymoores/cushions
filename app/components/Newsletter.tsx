import {useEffect, useRef} from 'react';
import {useFetcher, useSearchParams} from 'react-router';
import {Container} from './Container';
import {Eyebrow} from './Eyebrow';
import {SealMark} from './SealMark';
import {useSiteContent} from '~/lib/content';
import {
  HONEYPOT_FIELD,
  parseNewsletterStatus,
  type NewsletterStatus,
} from '~/lib/newsletter';

const ERROR_MESSAGES: Partial<Record<NewsletterStatus, string>> = {
  invalid: 'Please check your email address and try again.',
  error: 'That did not go through. Please try again in a moment.',
};

/**
 * Homepage sign-up (FAR-109). Posts to `app/routes/newsletter.tsx`, which
 * creates a Shopify customer with marketing consent for Shopify Email.
 *
 * Works with and without JavaScript: hydrated, the fetcher answers in place;
 * otherwise the plain form POST is redirected back here with
 * `?newsletter=<status>`, read below. Heading and body are the homepage
 * metaobject's `newsletter_heading` / `newsletter_body`.
 */
export function Newsletter() {
  const content = useSiteContent();
  const fetcher = useFetcher<{status: NewsletterStatus}>();
  const [searchParams] = useSearchParams();
  const status =
    fetcher.data?.status ??
    parseNewsletterStatus(searchParams.get('newsletter'));
  const submitted = status === 'subscribed';
  const errorMessage = status ? ERROR_MESSAGES[status] : undefined;
  const busy = fetcher.state !== 'idle';

  // Only the fetcher path reaches PostHog: without JavaScript there is no
  // client to send from. Already-subscribed addresses count too — the server
  // deliberately doesn't tell the two apart.
  const tracked = useRef<unknown>(null);
  useEffect(() => {
    const result = fetcher.data;
    if (result?.status !== 'subscribed' || tracked.current === result) return;
    tracked.current = result;
    // Same instance `PostHogAnalytics` initialised; without a key it was never
    // loaded, so this stays a no-op.
    void import('posthog-js').then(({default: posthog}) => {
      if (posthog.__loaded) posthog.capture('newsletter_signup');
    });
  }, [fetcher.data]);

  return (
    <section id="newsletter" className="bg-paper section-y">
      <Container>
        <div className="max-w-[420px] mx-auto text-center">
          {submitted ? (
            <div className="flex flex-col items-center" role="status">
              <SealMark size={20} filled className="text-clay mb-5" />
              <Eyebrow className="block mb-3">Thank you</Eyebrow>
              <p className="text-ash text-[14px] leading-[1.7] font-light">
                A quiet note will arrive when the next pieces are ready.
              </p>
            </div>
          ) : (
            <>
              <Eyebrow className="block mb-6">Letters</Eyebrow>
              <h2 className="display-h1 text-ink">
                {content.newsletterHeading ?? 'be the first to know'}
              </h2>
              <p className="mt-6 text-ash text-[13px] leading-[1.7] font-light">
                {content.newsletterBody ??
                  'New fabrics arrive in small quantities and sell through quickly. Leave your email to hear when a new design lands.'}
              </p>
              <fetcher.Form
                method="post"
                action="/newsletter"
                className="mt-10 flex items-end gap-5"
              >
                <label className="flex-1 text-left">
                  <span className="eyebrow block mb-3">Email</span>
                  <input
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                    placeholder="you@yourhouse.com"
                    aria-invalid={errorMessage ? true : undefined}
                    aria-describedby={
                      errorMessage ? 'newsletter-error' : undefined
                    }
                    className="w-full bg-transparent border-0 border-b border-hairline pb-2 text-[14px] font-light text-ink placeholder:text-stone/70 focus:outline-none focus:border-ink transition-colors"
                  />
                </label>
                {/* Honeypot: hidden from people and screen readers, not from
                    bots that fill every field. Not `type="hidden"`, which
                    bots know to skip. */}
                <div aria-hidden="true" className="absolute -left-[9999px]">
                  <label>
                    Company
                    <input
                      type="text"
                      name={HONEYPOT_FIELD}
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="eyebrow pb-2 border-b border-ink text-ink hover:text-clay transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-wait"
                >
                  Subscribe
                </button>
              </fetcher.Form>
              {errorMessage ? (
                <p
                  id="newsletter-error"
                  role="alert"
                  className="mt-4 text-left text-clay text-[13px] leading-[1.7] font-light"
                >
                  {errorMessage}
                </p>
              ) : null}
            </>
          )}
        </div>
      </Container>
    </section>
  );
}
