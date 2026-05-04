import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/_index';
import {Container} from '~/components/Container';
import {Eyebrow} from '~/components/Eyebrow';
import {UnderlineLink} from '~/components/UnderlineLink';
import {ProductCard} from '~/components/ProductCard';
import {CollectionCard} from '~/components/CollectionCard';
import {EditorialSplit} from '~/components/EditorialSplit';
import {BleedSection} from '~/components/BleedSection';
import {ValuesStrip} from '~/components/ValuesStrip';
import {Newsletter} from '~/components/Newsletter';
import {
  collections,
  featuredCollection,
  placeholderImages,
} from '~/lib/mock-data';

const USE_MOCK_DATA = true;

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Maison Lévantine — Quiet rooms, slowly furnished'},
    {
      name: 'description',
      content:
        'Heirloom cushions sewn to order in north London. Linen, velvet, and undyed wool, repaired for life.',
    },
  ];
};

export async function loader(_args: Route.LoaderArgs) {
  if (USE_MOCK_DATA) {
    return {
      featuredCollection,
      browseCollections: collections,
    };
  }

  // Real Shopify path — uncomment once a store is connected and remove the
  // mock branch above. See the README for the full swap procedure.
  //
  // const {storefront} = _args.context;
  // const [{collections: featured}, {collections: browse}] = await Promise.all([
  //   storefront.query(FEATURED_COLLECTION_QUERY),
  //   storefront.query(BROWSE_COLLECTIONS_QUERY),
  // ]);
  // return {
  //   featuredCollection: featured.nodes[0],
  //   browseCollections: browse.nodes,
  // };

  throw new Error('USE_MOCK_DATA is false but no real loader is wired up.');
}

export default function Homepage() {
  const {featuredCollection: featured, browseCollections} =
    useLoaderData<typeof loader>();

  return (
    <>
      <Hero />
      <FeaturedCollection
        title={featured.title}
        products={featured.products.nodes}
      />
      <EditorialSplit
        eyebrow="House Notes"
        heading={
          <>
            On the quiet art
            <br />
            of <span className="italic-stone">mending</span>
          </>
        }
        body="A cushion well-mended carries more of its life with it. Send yours back when the seam tires; we re-line, re-fill, or close the loose stitch by hand and return it. There is no charge, and no expiry."
        ctaLabel="Read the journal"
        ctaTo="/journal"
        imageSrc={`${placeholderImages.editorialMending}`}
        imageAlt="Hands mending a piece of linen"
      />
      <BleedSection
        imageSrc={placeholderImages.bleedAtelier}
        imageAlt="The atelier in low evening light"
        eyebrow="By appointment"
        heading={
          <>
            Begin a <span className="italic">commission</span>
          </>
        }
        ctaLabel="Begin a Commission"
        ctaTo="/atelier"
      />
      <BrowseByCollection collections={browseCollections} />
      <ValuesStrip />
      <Newsletter />
    </>
  );
}

function Hero() {
  return (
    <section className="section-y bg-cream">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-5">
            <Eyebrow className="block mb-10">Spring · Twenty Twenty-Six</Eyebrow>
            <h1 className="font-serif font-light text-[56px] sm:text-[80px] lg:text-[104px] leading-[0.95] tracking-[-0.02em] text-ink">
              Quiet rooms,
              <br />
              <span className="italic-stone">slowly</span>
              <br />
              furnished
              <span className="text-rust">.</span>
            </h1>
            <p className="mt-10 text-stone text-[15px] leading-relaxed font-light max-w-md">
              Heirloom cushions, cut by hand from washed Belgian linen, aged
              cotton velvet, and undyed mountain wool. Each piece is sewn to
              order in our atelier and repaired, for life.
            </p>
            <div className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-6">
              <Link
                to="/collections/the-atelier-collection"
                className="btn-bleed text-ink"
              >
                Shop the Atelier
              </Link>
              <UnderlineLink
                to="/atelier"
                className="eyebrow text-ink"
                staticUnderline
              >
                Begin a commission
              </UnderlineLink>
            </div>
          </div>
          <div className="lg:col-span-7">
            <div className="aspect-[4/5] lg:aspect-[5/6] overflow-hidden bg-bone">
              <img
                src={placeholderImages.heroLinen}
                alt="A bone-coloured linen cushion resting on a low timber bench"
                loading="eager"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function FeaturedCollection({
  title,
  products,
}: {
  title: string;
  products: import('~/lib/mock-data').Product[];
}) {
  return (
    <section className="section-y bg-bone">
      <Container>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <div>
            <Eyebrow className="block mb-6">The Collection</Eyebrow>
            <h2 className="font-serif font-light text-[44px] sm:text-[56px] lg:text-[64px] leading-[0.95] tracking-[-0.02em]">
              {title.split(' ').slice(0, -1).join(' ')}{' '}
              <span className="italic-stone">
                {title.split(' ').slice(-1)}
              </span>
            </h2>
          </div>
          <UnderlineLink
            to="/collections/the-atelier-collection"
            className="eyebrow text-ink self-start md:self-end"
            staticUnderline
          >
            Browse all pieces
          </UnderlineLink>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-16 gap-x-10">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </Container>
    </section>
  );
}

function BrowseByCollection({
  collections: cols,
}: {
  collections: import('~/lib/mock-data').Collection[];
}) {
  return (
    <section className="section-y bg-cream">
      <Container>
        <div className="text-center max-w-xl mx-auto mb-20">
          <Eyebrow className="block mb-8">By Material</Eyebrow>
          <h2 className="font-serif font-light text-[40px] sm:text-[52px] lg:text-[60px] leading-[0.95] tracking-[-0.02em]">
            Browse by{' '}
            <span className="italic-stone">collection</span>
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-14 gap-x-8">
          {cols.map((c) => (
            <CollectionCard key={c.id} collection={c} />
          ))}
        </div>
      </Container>
    </section>
  );
}
