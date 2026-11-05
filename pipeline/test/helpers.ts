import type {Env} from '../src/env';
import type {FetchLike} from '../src/http';

/** In-memory stand-in for the KV methods the pipeline uses. */
export class MemoryKV {
  data = new Map<string, string>();
  async get(key: string, type?: 'json' | 'text') {
    const value = this.data.get(key);
    if (value === undefined) return null;
    return type === 'json' ? JSON.parse(value) : value;
  }
  async put(key: string, value: string) {
    this.data.set(key, value);
  }
  async delete(key: string) {
    this.data.delete(key);
  }
  async list({prefix = ''}: {prefix?: string} = {}) {
    const keys = [...this.data.keys()].filter((k) => k.startsWith(prefix)).sort().map((name) => ({name}));
    return {keys, list_complete: true, cacheStatus: null};
  }
}

export function makeEnv(overrides: Partial<Env> = {}, kv = new MemoryKV()): Env & {kv: MemoryKV} {
  return {
    AI: {
      run: async () => {
        throw new Error('AI must not be called in this test');
      },
    } as unknown as Ai,
    SISU_PIPELINE: kv as unknown as KVNamespace,
    kv,
    SHOP_DOMAIN: 'gqrjsh-ha.myshopify.com',
    SHOP_ADMIN_HANDLE: 'gqrjsh-ha',
    ADMIN_API_VERSION: '2026-10',
    STOREFRONT_API_VERSION: '2026-10',
    PUBLIC_STOREFRONT_API_TOKEN: 'public-token',
    SITE_URL: 'https://sisuhomeware.com',
    BLOG_HANDLE: 'journal',
    AUTHOR_NAME: 'Jessie Brewin',
    REVIEW_TO: 'a@example.com,b@example.com',
    REVIEW_FROM: 'Sisu <journal@example.com>',
    INDEXNOW_KEY: 'eba79443b09b890dcda1c687ab461b61',
    PRIMARY_MODEL: '@cf/openai/gpt-oss-120b',
    FALLBACK_MODEL: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    DRY_RUN: '0',
    PIPELINE_SECRET: 'test-secret-value',
    ...overrides,
  };
}

/** A fetch that fails the test if anything calls it. */
export const noNetwork: FetchLike = async (url) => {
  throw new Error(`unexpected network call to ${url}`);
};

const SENTENCE = 'A cushion looks best when the cover is full and the colour sits calmly in the room.';

/** A body_html of roughly `words` words with three question h2s and one known link. */
export function sampleBody(words = 700): string {
  const perSentence = SENTENCE.split(' ').length;
  const para = (n: number) => {
    const count = Math.ceil(n / perSentence);
    const out: string[] = [];
    for (let i = 0; i < count; i += 3) out.push(`<p>${Array(Math.min(3, count - i)).fill(SENTENCE).join(' ')}</p>`);
    return out.join('');
  };
  const third = Math.floor(words / 3) - 4;
  return [
    '<h2>What size should a cushion be?</h2>',
    para(third),
    '<h2>How full should it look?</h2>',
    para(third),
    '<h2>Where do you start?</h2>',
    para(third),
    '<p>See <a href="/journal/what-is-deadstock-fabric">what deadstock fabric is</a>.</p>',
  ].join('');
}

/** Record calls and answer from a route table keyed by URL prefix. */
export function routedFetch(routes: Record<string, (init?: RequestInit) => Response>) {
  const calls: Array<{url: string; init?: RequestInit}> = [];
  const fetcher: FetchLike = async (url, init) => {
    calls.push({url, init});
    const match = Object.keys(routes)
      .sort((a, b) => b.length - a.length)
      .find((prefix) => url.startsWith(prefix));
    if (!match) throw new Error(`no route for ${url}`);
    return routes[match]!(init);
  };
  return {fetcher, calls};
}
