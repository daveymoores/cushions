import type {Env} from './env';
import {fetchWithTimeout, TIMEOUT_MS, type FetchLike} from './http';

/**
 * Plain-fetch Shopify clients. The Storefront API (public token) gives product
 * facts and the text of live posts; the Admin API (custom app token, scopes
 * read_content + write_content) lists every article including drafts and
 * creates the unpublished draft. Nothing here can publish: there is no
 * articleUpdate or articlePublish, and isPublished is hard-coded false.
 */

type GraphQLResponse<T> = {data?: T; errors?: Array<{message: string}>};

async function graphql<T>(
  fetcher: FetchLike,
  url: string,
  headers: Record<string, string>,
  query: string,
  variables: Record<string, unknown>,
  label: string,
): Promise<T> {
  const response = await fetchWithTimeout(
    fetcher,
    url,
    {method: 'POST', headers: {'content-type': 'application/json', ...headers}, body: JSON.stringify({query, variables})},
    TIMEOUT_MS.shopify,
  );
  const text = await response.text();
  if (!response.ok) throw new Error(`${label}: HTTP ${response.status} ${text.slice(0, 300)}`);
  const body = JSON.parse(text) as GraphQLResponse<T>;
  if (body.errors?.length) throw new Error(`${label}: ${body.errors.map((e) => e.message).join('; ')}`);
  if (!body.data) throw new Error(`${label}: no data`);
  return body.data;
}

// ---------------------------------------------------------------- Storefront

export type StorefrontProduct = {
  handle: string;
  title: string;
  description: string;
  productType: string;
  options: Array<{name: string; optionValues: Array<{name: string}>}>;
  variants: {nodes: Array<{title: string; price: {amount: string; currencyCode: string}}>};
  metafields: Array<{key: string; value: string} | null>;
};

export type StorefrontArticle = {handle: string; title: string; contentHtml: string; publishedAt: string};

/** Same metafields as PRODUCT_FRAGMENT in app/lib/queries.ts. */
const FACTS_QUERY = `#graphql
  query PipelineFacts($blog: String!) {
    products(first: 100) {
      nodes {
        handle
        title
        description
        productType
        options { name optionValues { name } }
        variants(first: 50) { nodes { title price { amount currencyCode } } }
        metafields(
          identifiers: [
            {namespace: "custom", key: "front_fabric"}
            {namespace: "custom", key: "back_fabric"}
            {namespace: "custom", key: "trim"}
            {namespace: "custom", key: "insert"}
            {namespace: "custom", key: "care"}
          ]
        ) { key value }
      }
    }
    blog(handle: $blog) {
      articles(first: 50, sortKey: PUBLISHED_AT, reverse: true) {
        nodes { handle title contentHtml publishedAt }
      }
    }
  }
`;

export async function fetchStorefrontFacts(
  env: Env,
  fetcher: FetchLike,
): Promise<{products: StorefrontProduct[]; articles: StorefrontArticle[]}> {
  const data = await graphql<{
    products: {nodes: StorefrontProduct[]};
    blog: {articles: {nodes: StorefrontArticle[]}} | null;
  }>(
    fetcher,
    `https://${env.SHOP_DOMAIN}/api/${env.STOREFRONT_API_VERSION}/graphql.json`,
    {'X-Shopify-Storefront-Access-Token': env.PUBLIC_STOREFRONT_API_TOKEN},
    FACTS_QUERY,
    {blog: env.BLOG_HANDLE},
    'Storefront facts query',
  );
  return {products: data.products.nodes, articles: data.blog?.articles.nodes ?? []};
}

// --------------------------------------------------------------------- Admin

function adminRequest<T>(env: Env, fetcher: FetchLike, query: string, variables: Record<string, unknown>, label: string) {
  if (!env.SHOPIFY_ADMIN_TOKEN) throw new Error(`${label}: SHOPIFY_ADMIN_TOKEN is not set`);
  return graphql<T>(
    fetcher,
    `https://${env.SHOP_DOMAIN}/admin/api/${env.ADMIN_API_VERSION}/graphql.json`,
    {'X-Shopify-Access-Token': env.SHOPIFY_ADMIN_TOKEN},
    query,
    variables,
    label,
  );
}

const BLOGS_QUERY = `#graphql
  query PipelineBlogs { blogs(first: 10) { nodes { id handle } } }
`;

export async function findBlogId(env: Env, fetcher: FetchLike): Promise<string> {
  const data = await adminRequest<{blogs: {nodes: Array<{id: string; handle: string}>}}>(
    env,
    fetcher,
    BLOGS_QUERY,
    {},
    'Admin blogs query',
  );
  const blog = data.blogs.nodes.find((b) => b.handle === env.BLOG_HANDLE);
  if (!blog) throw new Error(`No blog with handle "${env.BLOG_HANDLE}" in Shopify admin`);
  return blog.id;
}

export type AdminArticle = {handle: string; title: string; isPublished: boolean};

const BLOG_ARTICLES_QUERY = `#graphql
  query PipelineArticles($id: ID!) {
    blog(id: $id) { articles(first: 250) { nodes { handle title isPublished } } }
  }
`;

/** Every article in the journal, drafts included (the Storefront API cannot see drafts). */
export async function listAdminArticles(env: Env, fetcher: FetchLike, blogId: string): Promise<AdminArticle[]> {
  const data = await adminRequest<{blog: {articles: {nodes: AdminArticle[]}} | null}>(
    env,
    fetcher,
    BLOG_ARTICLES_QUERY,
    {id: blogId},
    'Admin articles query',
  );
  return data.blog?.articles.nodes ?? [];
}

const ARTICLE_CREATE = `#graphql
  mutation PipelineArticleCreate($article: ArticleCreateInput!) {
    articleCreate(article: $article) {
      article { id handle isPublished }
      userErrors { code field message }
    }
  }
`;

export type CreatedArticle = {id: string; handle: string; adminUrl: string};

export function adminArticleUrl(env: Env, gid: string): string {
  const numeric = gid.split('/').pop();
  return `https://admin.shopify.com/store/${env.SHOP_ADMIN_HANDLE}/content/articles/${numeric}`;
}

export type DraftArticleInput = {
  blogId: string;
  title: string;
  handle: string;
  bodyHtml: string;
  summary: string;
  author: string;
};

/** Build the articleCreate variables. isPublished is always false. */
export function draftArticleVariables(input: DraftArticleInput) {
  return {
    article: {
      blogId: input.blogId,
      title: input.title,
      handle: input.handle,
      body: input.bodyHtml,
      summary: input.summary,
      isPublished: false,
      tags: ['journal', 'draft-by-pipeline'],
      author: {name: input.author},
    },
  };
}

export async function createDraftArticle(
  env: Env,
  fetcher: FetchLike,
  input: DraftArticleInput,
): Promise<CreatedArticle> {
  const data = await adminRequest<{
    articleCreate: {
      article: {id: string; handle: string; isPublished: boolean} | null;
      userErrors: Array<{code: string | null; field: string[] | null; message: string}>;
    };
  }>(env, fetcher, ARTICLE_CREATE, draftArticleVariables(input), 'Admin articleCreate');
  const {article, userErrors} = data.articleCreate;
  if (userErrors.length || !article) {
    throw new Error(
      `articleCreate refused: ${userErrors.map((e) => `${(e.field ?? []).join('.')} ${e.message}`).join('; ') || 'no article returned'}`,
    );
  }
  return {id: article.id, handle: article.handle, adminUrl: adminArticleUrl(env, article.id)};
}
