import {data, redirect} from 'react-router';
import type {Route} from './+types/newsletter';
import {usesMockData} from '~/lib/storefront';
import {HONEYPOT_FIELD, type NewsletterStatus} from '~/lib/newsletter';

/**
 * Newsletter sign-up endpoint (FAR-109). Resource route: POST only, no UI.
 *
 * Each address becomes a Shopify customer with marketing consent, via the
 * Storefront API's `customerCreate`, so Jessie reaches it from Shopify Email
 * alongside everyone who has ordered. The password is random and never shown
 * — it exists only because the mutation requires one.
 *
 * Two callers, told apart by `isDocumentRequest`:
 *   - with JavaScript, the `<Newsletter>` fetcher gets the JSON result and
 *     swaps the form for a message in place;
 *   - without it, the browser does a plain form POST and is redirected back to
 *     the homepage with `?newsletter=<status>`, which the component reads.
 *
 * An address that is already a customer (`TAKEN`) gets the same "thank you"
 * as a new one, so the form never reveals who is on the list. Note that the
 * Storefront API cannot change consent on an existing customer: a past buyer
 * who signs up here is thanked but not subscribed.
 */

/** Where the no-JS path lands. The `#newsletter` anchor is the section id. */
const RETURN_PATH = '/';

const CUSTOMER_CREATE_MUTATION = `#graphql
  mutation NewsletterCustomerCreate($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customer {
        id
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
` as const;

// Deliberately loose: the browser's `type="email"` and Shopify's own check do
// the real validation. This only stops obvious junk before a network call.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

export function loader() {
  return redirect(`${RETURN_PATH}#newsletter`);
}

export async function action({request, context}: Route.ActionArgs) {
  const formData = await request.formData();
  const honeypot = formData.get(HONEYPOT_FIELD);
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();

  let status: NewsletterStatus;
  if (typeof honeypot === 'string' && honeypot !== '') {
    // Look like a success so the bot moves on; nothing is sent to Shopify.
    status = 'subscribed';
  } else if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
    status = 'invalid';
  } else {
    status = await subscribe(email, context);
  }

  if (isDocumentRequest(request)) {
    return redirect(`${RETURN_PATH}?newsletter=${status}#newsletter`, 303);
  }
  return data({status}, {status: status === 'error' ? 502 : 200});
}

async function subscribe(
  email: string,
  context: Route.ActionArgs['context'],
): Promise<NewsletterStatus> {
  if (usesMockData(context.env)) {
    // No real shop to write to; say so rather than thank someone for nothing.
    console.warn('[newsletter] mock-data mode, sign-up not sent to Shopify');
    return 'error';
  }

  try {
    const {customerCreate} = await context.storefront.mutate(
      CUSTOMER_CREATE_MUTATION,
      {
        variables: {
          input: {email, password: randomPassword(), acceptsMarketing: true},
        },
      },
    );
    const errors = customerCreate?.customerUserErrors ?? [];
    if (customerCreate?.customer?.id) return 'subscribed';
    // Already a customer: same answer as a new sign-up (see the file comment).
    if (errors.some((error) => error.code === 'TAKEN')) return 'subscribed';
    if (
      errors.some(
        (error) =>
          error.field?.includes('email') &&
          (error.code === 'INVALID' ||
            error.code === 'BLANK' ||
            error.code === 'TOO_LONG' ||
            error.code === 'BAD_DOMAIN'),
      )
    ) {
      return 'invalid';
    }
    console.error(
      '[newsletter] customerCreate rejected the sign-up',
      JSON.stringify(errors),
    );
    return 'error';
  } catch (error) {
    console.error('[newsletter] customerCreate failed', error);
    return 'error';
  }
}

/**
 * A browser's own form POST (no JavaScript) navigates the document, so it
 * needs a redirect back to a page. A fetcher's `fetch()` reports neither
 * `Sec-Fetch-Dest: document` nor an HTML `Accept`, and wants data instead.
 */
function isDocumentRequest(request: Request): boolean {
  if (request.headers.get('Sec-Fetch-Dest') === 'document') return true;
  return (request.headers.get('Accept') ?? '').includes('text/html');
}

/**
 * One v4 UUID: 36 characters, 122 random bits, no whitespace, never shown to
 * anyone. Shopify caps the password at 40 characters (`TOO_LONG` beyond).
 */
function randomPassword(): string {
  return crypto.randomUUID();
}
