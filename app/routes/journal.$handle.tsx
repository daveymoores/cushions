import {useLoaderData, data} from 'react-router';
import type {Route} from './+types/journal.$handle';
import {Container} from '~/components/Container';
import {Eyebrow} from '~/components/Eyebrow';
import {UnderlineLink} from '~/components/UnderlineLink';
import {ARTICLE_QUERY} from '~/lib/queries';
import {usesMockData} from '~/lib/storefront';
import {routeMeta, articleSeo} from '~/lib/seo';

export const meta: Route.MetaFunction = ({data, matches}) =>
  routeMeta(matches, data?.seo, 'article');

export async function loader({params, context, request}: Route.LoaderArgs) {
  const {handle} = params;
  if (!handle) throw new Response('Not found', {status: 404});
  if (usesMockData(context.env)) throw new Response('Not found', {status: 404});

  const {blog} = await context.storefront.query(ARTICLE_QUERY, {
    variables: {blog: 'journal', handle},
  });
  const article = blog?.articleByHandle;
  if (!article) throw new Response('Not found', {status: 404});
  return data({article, seo: articleSeo(article, request, context.env)});
}

export default function Article() {
  const {article} = useLoaderData<typeof loader>();

  return (
    <article className="section-y bg-paper">
      <Container>
        <div className="max-w-2xl mx-auto">
          <div className="mb-10">
            <UnderlineLink to="/journal" className="eyebrow text-ash hover:text-ink">
              ← Back to the journal
            </UnderlineLink>
          </div>

          <Eyebrow className="block mb-5">
            {article.publishedAt
              ? new Date(article.publishedAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : 'House Notes'}
            {article.author?.name ? ` · ${article.author.name}` : ''}
          </Eyebrow>
          <h1 className="display-h1 text-ink">{article.title}</h1>

          {article.image ? (
            <div className="aspect-[16/9] bg-bone overflow-hidden mt-10">
              <img
                src={article.image.url}
                alt={article.image.altText ?? article.title}
                loading="eager"
                className="w-full h-full object-cover image-grade"
              />
            </div>
          ) : null}

          <div
            className="prose-editorial mt-10 text-ash text-[15px] leading-[1.8] font-light"
            dangerouslySetInnerHTML={{__html: article.contentHtml}}
          />
        </div>
      </Container>
    </article>
  );
}
