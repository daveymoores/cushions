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
 * - Shipping: Settings → Shipping and delivery — encoded from what checkout
 *   actually charges, not from the site copy, which as of 2026-09-28 promises
 *   free shipping over €300 everywhere when only NL gets it.
 *
 * When either changes in admin, update this file in the same piece of work.
 * Otherwise the site tells Google one policy while checkout charges another.
 * Last verified against the live store on 2026-09-28.
 *
 * Re-verifying shipping needs no Admin token. Storefront API `cartCreate` with
 * a line, `buyerIdentity.countryCode` and a `delivery.addresses` entry for the
 * country, then read `cart.deliveryGroups.nodes.deliveryOptions.estimatedCost`
 * — that is the rate checkout will charge. Vary the quantity to find order-value
 * thresholds. (Recipe for the token and endpoint: docs/OWNERS-GUIDE.md §4.)
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
    // Checked either side of the line: €285 → €6.95, €300 → free.
    tiers: [
      {fromOrderValue: 0, rate: 6.95},
      {fromOrderValue: 300, rate: 0},
    ],
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

/** The full shipping policy, for `Organization.hasShippingService`. */
export function organizationShippingService(): JsonLdNode {
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
    shippingConditions: SHIPPING_ZONES.flatMap((zone) =>
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
 * ever reaches its threshold.
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
): JsonLdNode[] | undefined {
  if (!Number.isFinite(price)) return undefined;
  const details = SHIPPING_ZONES.filter((zone) => zone.currency === currency).map(
    (zone) => {
      const tier =
        zone.tiers.filter((t) => price >= t.fromOrderValue).at(-1) ??
        zone.tiers[0];
      return {
        '@type': 'OfferShippingDetails',
        shippingDestination: definedRegions(zone.countries),
        shippingRate: money(tier.rate, zone.currency),
      };
    },
  );
  return details.length > 0 ? details : undefined;
}
