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
 * Handle of the collection featured on the homepage hero strip — the launch
 * collection in admin. If it doesn't exist yet, the loader falls back to the
 * first available collection so the strip is never empty.
 */
const FEATURED_HANDLE = 'cushions';

export const meta: Route.MetaFunction = ({data, matches}) =>
  routeMeta(matches, data?.seo);

export async function loader({context, request}: Route.LoaderArgs) {
  // Title and description are left to the site-wide defaults in `rootSeo` —
  // the homepage is the page those defaults describe.
  const seo = {
    url: canonical(request, context.env),
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
          'A deadstock-fabric cushion at rest on a low sofa'
        }
        eyebrow={content.heroEyebrow ?? 'First collection · Amsterdam'}
        heading={heading(
          content.heroHeading,
          <>
            good fabric,
            <br />
            given a second life
          </>,
        )}
        ctaLabel={content.heroCtaLabel ?? 'Shop cushions'}
        ctaTo="/collections"
      />

      <IntroStrip />

      <EditorialSplit
        eyebrow="House Notes"
        heading={heading(
          content.mendingHeading,
          <>
            Nothing new,
            <br />
            nothing <span className="italic-stone">wasted</span>
          </>,
        )}
        body={
          content.mendingBody ??
          'Every Sisu cushion starts as fabric that already exists — deadstock sourced from EU suppliers, kept out of landfill and given a second life. Because each fabric run is finite, every design is naturally limited: when a roll is used up, that exact cushion won’t be made again.'
        }
        ctaLabel="Read the journal"
        ctaTo="/journal"
        imageSrc={placeholderImages.editorialMending}
        imageAlt="A folded length of patterned deadstock fabric"
      />

      <FeaturedCollection
        title={featured.title}
        products={featured.products.nodes}
      />

      <BleedSection
        imageSrc={placeholderImages.bleedAtelier}
        imageAlt="The atelier in low evening light"
        eyebrow="In the studio"
        heading={heading(
          content.commissionHeading,
          <>
            cut and sewn in <span className="italic">small batches</span>
          </>,
        )}
        ctaLabel="About Sisu"
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
          'Heavyweight upholstery jacquards, ribbed velvets and woven geometrics, rescued from designer surplus. Each cushion is tracked individually — face fabric, backing and fringe — because quantities are inherently limited.'
        }
        ctaLabel="See the fabrics"
        ctaTo="/materials"
        imageSrc={placeholderImages.collectionLinen}
        imageAlt="A stack of folded surplus fabric"
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
                Cushions made from deadstock fabric, cut and sewn in small
                batches in Amsterdam —{' '}
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
