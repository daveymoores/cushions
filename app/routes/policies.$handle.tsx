import {useLoaderData, data, redirect} from 'react-router';
import type {Route} from './+types/policies.$handle';
import {Container} from '~/components/Container';
import {Eyebrow} from '~/components/Eyebrow';
import {SealMark} from '~/components/SealMark';
import {POLICY_QUERY} from '~/lib/queries';
import {usesMockData} from '~/lib/storefront';
import {routeMeta, pageSeo} from '~/lib/seo';

export const meta: Route.MetaFunction = ({data, matches}) =>
  routeMeta(matches, data?.seo);

/**
 * URL handle → the `shop` field holding that policy. The handles are the ones
 * Shopify's Online Store serves policies at, so `/policies/<handle>` is the
 * same path on either host. A policy left blank in admin comes back null and
 * 404s, so only the ones the merchant has filled in are reachable.
 */
const POLICY_FIELDS = {
  'privacy-policy': 'privacyPolicy',
  'refund-policy': 'refundPolicy',
  'shipping-policy': 'shippingPolicy',
  'terms-of-service': 'termsOfService',
  'terms-of-sale': 'termsOfSale',
  'subscription-policy': 'subscriptionPolicy',
  'contact-information': 'contactInformation',
} as const;

type PolicyHandle = keyof typeof POLICY_FIELDS;
type PolicyField = (typeof POLICY_FIELDS)[PolicyHandle];

/** Own keys only — `/policies/constructor` must not find `Object`. */
function isPolicyHandle(handle: string): handle is PolicyHandle {
  return Object.hasOwn(POLICY_FIELDS, handle);
}

/**
 * Store policies (Settings → Policies), rendered as pages. Any policy the
 * merchant fills in is live here with zero code.
 */
export async function loader({params, context, request}: Route.LoaderArgs) {
  const {handle} = params;
  if (!handle) throw new Response('Not found', {status: 404});

  // The footer used to link `/policies/contact`, which is not a Shopify
  // handle. Keep anything already pointing there working. Must run before the
  // mock-data 404 below.
  if (handle === 'contact') {
    const {search} = new URL(request.url);
    throw redirect(`/policies/contact-information${search}`, 301);
  }

  if (!isPolicyHandle(handle) || usesMockData(context.env)) {
    throw new Response('Not found', {status: 404});
  }

  const field = POLICY_FIELDS[handle];
  const {shop} = await context.storefront.query(POLICY_QUERY, {
    variables: Object.fromEntries(
      Object.values(POLICY_FIELDS).map((f) => [f, f === field]),
    ) as Record<PolicyField, boolean>,
  });
  const policy = shop[field];
  if (!policy) throw new Response('Not found', {status: 404});
  return data({policy, seo: pageSeo(policy, request, context.env)});
}

export default function Policy() {
  const {policy} = useLoaderData<typeof loader>();

  return (
    <section className="section-y bg-paper">
      <Container>
        <div className="max-w-2xl">
          <SealMark size={14} className="text-ink/70 mb-6" />
          <Eyebrow className="block mb-5">Sisu</Eyebrow>
          <h1 className="display-h1 text-ink">{policy.title}</h1>
          <div
            className="prose-editorial mt-8 text-ash text-[14px] leading-[1.7] font-light"
            dangerouslySetInnerHTML={{__html: policy.body}}
          />
        </div>
      </Container>
    </section>
  );
}
