import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/journal';
import {StubPage} from '~/components/StubPage';
import {Container} from '~/components/Container';
import {Eyebrow} from '~/components/Eyebrow';
import {BLOG_QUERY} from '~/lib/queries';
import {usesMockData} from '~/lib/storefront';
import {routeMeta, basicSeo} from '~/lib/seo';

export const meta: Route.MetaFunction = ({data, matches}) =>
  routeMeta(matches, data?.seo);

/**
 * The Journal lists articles from a Shopify blog with the handle `journal`
 * (Online Store → Blog posts). Create the blog + posts in admin and they appear
 * here. Until then, the placeholder below is shown.
 */
export async function loader({context, request}: Route.LoaderArgs) {
  const seo = basicSeo({
    title: 'Journal',
    description:
      'Notes from the studio — on deadstock fabric, and how a Sisu cushion is made.',
    request,
    env: context.env,
  });

  if (usesMockData(context.env)) return {articles: [], seo};

  const {blog} = await context.storefront.query(BLOG_QUERY, {
    variables: {handle: 'journal', first: 12},
  });
  return {articles: blog?.articles.nodes ?? [], seo};
}

export default function Journal() {
  const {articles} = useLoaderData<typeof loader>();

  if (articles.length === 0) {
    return (
      <StubPage
        eyebrow="House Notes"
        title={
          <>
            The <span className="italic-stone">journal</span>
          </>
        }
        body="Notes from the studio — on deadstock fabric, the suppliers we buy from, and how a Sisu cushion is made. Coming soon."
      />
    );
  }

  return (
    <section className="section-y bg-paper">
      <Container>
        <div className="max-w-xl mb-14">
          <Eyebrow className="block mb-5">House Notes</Eyebrow>
          <h1 className="display-h1 text-ink">
            The <span className="italic-stone">journal</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-14 gap-x-10">
          {articles.map((article) => (
            <Link
              key={article.id}
              to={`/journal/${article.handle}`}
              className="product-card group block"
            >
              {article.image ? (
                <div className="product-card-image aspect-[4/5]">
                  <img
                    src={article.image.url}
                    alt={article.image.altText ?? article.title}
                    loading="lazy"
                    className="w-full h-full object-cover image-grade"
                  />
                </div>
              ) : null}
              <div className="pt-6">
                {article.publishedAt ? (
                  <p className="eyebrow text-ash mb-3">
                    {new Date(article.publishedAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                ) : null}
                <h2 className="font-display text-[22px] text-ink leading-tight">
                  {article.title}
                </h2>
                {article.excerpt ? (
                  <p className="mt-2 text-ash text-[13px] leading-relaxed font-light line-clamp-3 max-w-md">
                    {article.excerpt}
                  </p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
