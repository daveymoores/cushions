/**
 * Returns and shipping policy as schema.org structured data, for Google's
 * merchant listings. `rootSeo` puts the full policy on the Organization;
 * `productSeo` repeats the subset Google accepts on an Offer. Both levels are
 * built from the constants below, so they can never disagree.
 *
 * Nothing here is read from the store. These constants MIRROR facts the
 * merchant controls in Shopify admin:
 *
 * - Returns: the `returns` page (Online Store → Pages), live at /pages/returns.
 * - Shipping: Settings → Shipping and delivery, plus any automatic shipping
 *   discount under Discounts — encoded from what checkout actually charges,
 *   not from the site copy, which as of 2026-09-28 promises free shipping over
 *   €300 everywhere when only NL gets it.
 *
 * When either changes in admin, update this file in the same piece of work.
 * Otherwise the site tells Google one policy while checkout charges another.
 * Last verified against the live store on 2026-09-28; NL re-verified on
 * 2026-10-09 after the free-shipping promotion went live.
 *
 * Re-verifying shipping needs no Admin token. Storefront API `cartCreate` with
 * a line, `buyerIdentity.countryCode` and a `delivery.addresses` entry for the
 * country, then read two things:
 *
 * - `cart.deliveryGroups.nodes.deliveryOptions.estimatedCost` — the rate as
 *   configured in Shipping and delivery.
 * - `cart.discountAllocations` — an automatic shipping discount does NOT
 *   lower `estimatedCost`. It appears here instead, as an allocation with
 *   `targetType: SHIPPING_LINE`, and its `discountedAmount` comes off the rate.
 *
 * The rate minus that allocation is what checkout charges. Reading only
 * `estimatedCost` reports €6.95 for NL today, which is wrong. Vary the
 * quantity to find order-value thresholds. (Recipe for the token and
 * endpoint: docs/OWNERS-GUIDE.md §4.)
 */

const SCHEMA = 'https://schema.org/';

type JsonLdNode = Record<string, unknown>;

/**
 * Every country the store sells to through Shopify Markets. The return policy
 * applies in all of them; shipping is published for most (see
 * `SHIPPING_ZONES`).
 */
const MARKET_COUNTRIES = [
  'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI',
  'FR', 'GB', 'GR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV',
  'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK',
] as const;

type MarketCountry = (typeof MARKET_COUNTRIES)[number];

// ---------------------------------------------------------------------------
// Returns — mirrors /pages/returns
// ---------------------------------------------------------------------------

const RETURNS_PATH = '/pages/returns';

/**
 * The part of the return policy Google accepts at both levels. The offer-level
 * subset is applicableCountry, returnPolicyCategory, merchantReturnDays,
 * returnFees, returnMethod and returnShippingFeesAmount (merchant-listing doc,
 * "Returns") — so nothing else may go here.
 *
 * `returnPolicyCountry` is deliberately absent: the return address isn't
 * published anywhere.
 */
const RETURN_POLICY_CORE = {
  '@type': 'MerchantReturnPolicy',
  applicableCountry: [...MARKET_COUNTRIES],
  returnPolicyCategory: `${SCHEMA}MerchantReturnFiniteReturnWindow`,
  // "30 days from delivery", which is how Google counts merchantReturnDays.
  merchantReturnDays: 30,
  // The customer emails hello@ and posts the item back.
  returnMethod: `${SCHEMA}ReturnByMail`,
  // The customer arranges and pays for return postage themselves. Not
  // `ReturnShippingFees`, which means Sisu charges a label fee of a stated
  // amount.
  returnFees: `${SCHEMA}ReturnFeesCustomerResponsibility`,
} as const;

/** The full return policy, for `Organization.hasMerchantReturnPolicy`. */
export function organizationReturnPolicy(site: string): JsonLdNode {
  return {
    ...RETURN_POLICY_CORE,
    merchantReturnLink: site + RETURNS_PATH,
    refundType: `${SCHEMA}FullRefund`,
    // "Unused and in its original condition".
    itemCondition: `${SCHEMA}NewCondition`,
    customerRemorseReturnFees: `${SCHEMA}ReturnFeesCustomerResponsibility`,
    // "Unless the item arrived faulty or wasn't what you ordered" — then Sisu
    // covers it. Wrong-item returns have no schema.org property of their own.
    itemDefectReturnFees: `${SCHEMA}FreeReturn`,
  };
}

/** The offer-level subset, for `Offer.hasMerchantReturnPolicy`. */
export function offerReturnPolicy(): JsonLdNode {
  return {...RETURN_POLICY_CORE};
}

// ---------------------------------------------------------------------------
// Shipping — mirrors Settings → Shipping and delivery
// ---------------------------------------------------------------------------

type ShippingTier = {
  /** Order value this rate starts at, inclusive, in the zone's currency. */
  fromOrderValue: number;
  rate: number;
};

type ShippingZone = {
  countries: readonly MarketCountry[];
  /** ISO 4217. The currency checkout charges this zone in. */
  currency: string;
  /** Ascending by `fromOrderValue`; the first tier starts at 0. */
  tiers: readonly ShippingTier[];
  /**
   * A time-limited schedule that replaces `tiers` until `until` (an ISO 8601
   * instant, exclusive), after which `tiers` applies again with no deploy.
   * For an automatic shipping discount in admin, which leaves the configured
   * rate alone and discounts it at checkout.
   */
  promotion?: {until: string; tiers: readonly ShippingTier[]};
};

/**
 * Shipping rates as checkout charges them.
 *
 * CZ, DK, HU, PL, RO and SE are deliberately missing. Checkout charges them a
 * Shopify Markets FX conversion of €12.95 (323 CZK, 99 DKK, 4900 HUF, 58 PLN,
 * 70 RON, 150 SEK on 2026-09-28), which drifts with the exchange rate, so no
 * fixed number here would stay true.
 */
const SHIPPING_ZONES: readonly ShippingZone[] = [
  {
    countries: ['NL'],
    currency: 'EUR',
    // The configured rates, which return when the promotion below ends.
    // Checked either side of the line: €285 → €6.95, €300 → free.
    tiers: [
      {fromOrderValue: 0, rate: 6.95},
      {fromOrderValue: 300, rate: 0},
    ],
    // Automatic discount "Free shipping Netherlands": 100% off the NL shipping
    // line at any order value, ending 31 Dec 2026 23:59 Europe/Amsterdam.
    // Encoded as ending at 2027-01-01 00:00 Amsterdam (CET, UTC+1), so the
    // markup may say free for up to a minute after checkout stops doing so.
    // Verified 2026-10-09: €135 and €150 carts rate €6.95 with a −€6.95
    // allocation, so checkout charges €0; a €300 cart rates €0 with no
    // allocation, so the tiers above are still configured underneath.
    promotion: {
      until: '2026-12-31T23:00:00Z',
      tiers: [{fromOrderValue: 0, rate: 0}],
    },
  },
  {
    // No free-shipping threshold (checked up to a €1,035 order).
    countries: [
      'AT', 'BE', 'BG', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR',
      'HR', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'PT', 'SI', 'SK',
    ],
    currency: 'EUR',
    tiers: [{fromOrderValue: 0, rate: 12.95}],
  },
  {
    countries: ['GB'],
    currency: 'GBP',
    tiers: [{fromOrderValue: 0, rate: 18}],
  },
];

/**
 * The zones as they stand at `now`, with any running promotion in place of
 * the configured tiers.
 *
 * How long the markup can lag a promotion ending: nothing on our side. `now`
 * is read per call, from the loaders (`rootSeo` in the root loader,
 * `productSeo` in the product loader), never at module scope, where it would
 * freeze when the Oxygen isolate starts. Root's `CacheShort` and the
 * stale-while-revalidate windows apply only to Storefront API sub-requests,
 * and nothing in this file comes from one; the HTML itself is not cached
 * (Oxygen answers `oxygen-full-page-cache: uncacheable`, and no route sets a
 * `cache-control` on documents). So the first request after the cutoff gets
 * the new rates, and the remaining lag is how long Google takes to recrawl
 * each page. Adding full-page caching or an HTML `cache-control` later would
 * add its max-age plus stale-while-revalidate to that.
 *
 * In a browser only: root's `shouldRevalidate` keeps root loader data across
 * client-side navigation, so a tab left open over the cutoff shows the old
 * Organization markup until it reloads. Crawlers always load fresh.
 */
function shippingZonesAt(now: Date): readonly ShippingZone[] {
  return SHIPPING_ZONES.map(({promotion, ...zone}) =>
    promotion && now.getTime() < Date.parse(promotion.until)
      ? {...zone, tiers: promotion.tiers}
      : zone,
  );
}

/**
 * "Orders are sent within 2 business days." `businessDays` is left unset
 * because which days count as business days isn't published.
 *
 * Transit time isn't published either, so it appears nowhere in this file.
 * Don't estimate one: Google shows it to shoppers as a delivery promise.
 */
const HANDLING_DAYS = {minValue: 0, maxValue: 2} as const;

function definedRegions(countries: readonly MarketCountry[]): JsonLdNode[] {
  return countries.map((addressCountry) => ({
    '@type': 'DefinedRegion',
    addressCountry,
  }));
}

function money(value: number, currency: string): JsonLdNode {
  return {'@type': 'MonetaryAmount', value, currency};
}

/**
 * The order-value band a tier covers. The upper bound is one cent below the
 * next tier's start, the way Google's own example writes a threshold.
 */
function orderValueBand(zone: ShippingZone, index: number): JsonLdNode {
  const next = zone.tiers[index + 1];
  return {
    '@type': 'MonetaryAmount',
    minValue: zone.tiers[index].fromOrderValue,
    ...(next ? {maxValue: (next.fromOrderValue * 100 - 1) / 100} : {}),
    currency: zone.currency,
  };
}

/**
 * The full shipping policy, for `Organization.hasShippingService`. A zone with
 * one tier — NL during its promotion included — is an unconditional rate: no
 * `orderValue` band, and a `shippingRate` of 0 where it's free, which is how
 * Google's shipping-policy doc says to state free shipping.
 */
export function organizationShippingService(now = new Date()): JsonLdNode {
  return {
    '@type': 'ShippingService',
    handlingTime: {
      '@type': 'ServicePeriod',
      duration: {
        '@type': 'QuantitativeValue',
        ...HANDLING_DAYS,
        unitCode: 'DAY',
      },
    },
    shippingConditions: shippingZonesAt(now).flatMap((zone) =>
      zone.tiers.map((tier, i) => ({
        '@type': 'ShippingConditions',
        shippingDestination: definedRegions(zone.countries),
        // A single-rate zone has no band to describe.
        ...(zone.tiers.length > 1 ? {orderValue: orderValueBand(zone, i)} : {}),
        shippingRate: money(tier.rate, zone.currency),
      })),
    ),
  };
}

/**
 * Shipping for one unit of an offer, for `Offer.shippingDetails`.
 *
 * Only zones charged in the offer's own currency are included: Google requires
 * an offer's shipping rate to be "the same as the currency of the offer", so
 * GB (GBP) stays on the Organization only while prices are in EUR. The rate is
 * whichever tier the offer's price falls in, so NL goes free if a single item
 * ever reaches its threshold — and at any price while its promotion runs.
 * Free is `shippingRate.value: 0`, per Google's merchant-listing doc; there is
 * no separate free-shipping property to set.
 *
 * `deliveryTime` is omitted. Google defines it as the total delay from order
 * to delivery, and with no published transit time the only number available
 * is handling, which would read as a 0–2 day delivery promise. Add it with
 * both `handlingTime` and `transitTime` once transit time is known.
 *
 * Returns `undefined` rather than an empty array when nothing applies, so the
 * property is dropped instead of emitted empty.
 */
export function offerShippingDetails(
  price: number,
  currency: string,
  now = new Date(),
): JsonLdNode[] | undefined {
  if (!Number.isFinite(price)) return undefined;
  const details = shippingZonesAt(now)
    .filter((zone) => zone.currency === currency)
    .map((zone) => {
      const tier =
        zone.tiers.filter((t) => price >= t.fromOrderValue).at(-1) ??
        zone.tiers[0];
      return {
        '@type': 'OfferShippingDetails',
        shippingDestination: definedRegions(zone.countries),
        shippingRate: money(tier.rate, zone.currency),
      };
    });
  return details.length > 0 ? details : undefined;
}
