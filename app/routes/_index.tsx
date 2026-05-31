import {useLoaderData} from 'react-router';
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
import {Hero} from '~/components/Hero';
import {SealMark} from '~/components/SealMark';
import {
  collections,
  featuredCollection,
  placeholderImages,
} from '~/lib/mock-data';
import {COLLECTION_QUERY, COLLECTIONS_QUERY} from '~/lib/queries';
import {toCollection, toCollectionCard} from '~/lib/adapters';
import {usesMockData} from '~/lib/storefront';
import {routeMeta, canonical} from '~/lib/seo';
import {useSiteContent} from '~/lib/content';

/**
 * Handle of the collection featured on the homepage hero strip.
 * TODO: point this at the real Sisu featured collection once it exists in admin
 * (e.g. 'the-atelier-collection'). For now it uses a populated sample collection
 * so the strip renders live products.
 */
const FEATURED_HANDLE = 'automated-collection';

export const meta: Route.MetaFunction = ({data, matches}) =>
  routeMeta(matches, data?.seo);

export async function loader({context, request}: Route.LoaderArgs) {
  const seo = {
    title: 'Quiet rooms, slowly furnished',
    description:
      'Heirloom cushions sewn to order in north London. Linen, velvet, and undyed wool, repaired for life.',
    url: canonical(request),
  };

  if (usesMockData(context.env)) {
    return {
      seo,
      featuredCollection,
      browseCollections: collections,
    };
  }

  const {storefront} = context;
  const [featuredResult, browseResult] = await Promise.all([
    storefront.query(COLLECTION_QUERY, {
      variables: {handle: FEATURED_HANDLE, first: 6},
    }),
    storefront.query(COLLECTIONS_QUERY, {variables: {first: 8}}),
  ]);

  // If the configured featured collection doesn't exist in the store, fall back
  // to the first available collection so the homepage strip is never empty.
  let featured = featuredResult.collection;
  const firstBrowse = browseResult.collections.nodes[0];
  if (!featured && firstBrowse) {
    const fallback = await storefront.query(COLLECTION_QUERY, {
      variables: {handle: firstBrowse.handle, first: 6},
    });
    featured = fallback.collection;
  }

  return {
    seo,
    featuredCollection: featured
      ? toCollection(featured)
      : {...featuredCollection, products: {nodes: []}},
    browseCollections: browseResult.collections.nodes.map(toCollectionCard),
  };
}

/** Render managed text (preserving line breaks) or fall back to designed JSX. */
function heading(text: string | undefined, fallback: React.ReactNode) {
  return text ? <span className="whitespace-pre-line">{text}</span> : fallback;
}

export default function Homepage() {
  const {featuredCollection: featured, browseCollections} =
    useLoaderData<typeof loader>();
  const content = useSiteContent();

  return (
    <>
      <Hero
        imageSrc={content.heroImage?.url ?? placeholderImages.heroLinen}
        imageAlt={
          content.heroImage?.altText ??
          'Bone-coloured linen cushion at rest on a low timber bench'
        }
        eyebrow={content.heroEyebrow ?? 'Spring · Twenty Twenty-Six'}
        heading={heading(
          content.heroHeading,
          <>
            quiet rooms,
            <br />
            slowly furnished
          </>,
        )}
        ctaLabel={content.heroCtaLabel ?? 'Enter the atelier'}
        ctaTo="/collections"
      />

      <IntroStrip />

      <EditorialSplit
        eyebrow="House Notes"
        heading={heading(
          content.mendingHeading,
          <>
            On the quiet art
            <br />
            of <span className="italic-stone">mending</span>
          </>,
        )}
        body={
          content.mendingBody ??
          'A cushion well-mended carries more of its life with it. Send yours back when the seam tires; we re-line, re-fill, or close the loose stitch by hand and return it. There is no charge, and no expiry.'
        }
        ctaLabel="Read the journal"
        ctaTo="/journal"
        imageSrc={placeholderImages.editorialMending}
        imageAlt="Hands mending a piece of linen"
      />

      <FeaturedCollection
        title={featured.title}
        products={featured.products.nodes}
      />

      <BleedSection
        imageSrc={placeholderImages.bleedAtelier}
        imageAlt="The atelier in low evening light"
        eyebrow="By appointment"
        heading={heading(
          content.commissionHeading,
          <>
            begin a <span className="italic">commission</span>
          </>,
        )}
        ctaLabel="Begin a commission"
        ctaTo="/atelier"
      />

      <EditorialSplit
        reverse
        eyebrow="On Material"
        heading={heading(
          content.materialHeading,
          <>
            cloth that <span className="italic-stone">holds</span> its
            life
          </>,
        )}
        body={
          content.materialBody ??
          'We work with three cloths only: heavyweight Belgian linen, aged cotton velvet dyed in the Levant, and undyed mountain wool from a single Tuscan loom. Every fibre is chosen for the way it ages — softening, deepening, never tiring.'
        }
        ctaLabel="See the materials"
        ctaTo="/materials"
        imageSrc={placeholderImages.collectionLinen}
        imageAlt="Stack of folded linen in raw cream"
      />

      <BrowseByCollection collections={browseCollections} />
      <ValuesStrip />
      <Newsletter />
    </>
  );
}

function IntroStrip() {
  const content = useSiteContent();
  return (
    <section className="bg-paper section-y-sm">
      <Container>
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
          <SealMark size={16} className="text-ink/70 mb-6" />
          <p className="display-h2 text-ink whitespace-pre-line">
            {content.intro ?? (
              <>
                Linens hand-loomed in northeastern Lebanon, sewn by hand in
                north London —{' '}
                <span className="italic-stone">made to be lived with</span>.
              </>
            )}
          </p>
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
    <section className="section-y bg-paper">
      <Container>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
          <div>
            <Eyebrow className="block mb-4">The Collection</Eyebrow>
            <h2 className="display-h2 text-ink">
              {title.split(' ').slice(0, -1).join(' ')}{' '}
              <span className="italic-stone">
                {title.split(' ').slice(-1)}
              </span>
            </h2>
          </div>
          <UnderlineLink
            to="/collections"
            className="eyebrow text-ink self-start md:self-end"
            staticUnderline
          >
            Browse all pieces
          </UnderlineLink>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-14 gap-x-10">
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
    <section className="section-y bg-paper">
      <Container>
        <div className="max-w-xl mb-14">
          <Eyebrow className="block mb-4">By Material</Eyebrow>
          <h2 className="display-h2 text-ink">
            Browse by <span className="italic-stone">collection</span>
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-6">
          {cols.map((c) => (
            <CollectionCard key={c.id} collection={c} />
          ))}
        </div>
      </Container>
    </section>
  );
}
