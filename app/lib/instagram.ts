/**
 * The homepage's Instagram strip, fed by Behold (https://behold.so): Behold
 * holds the Instagram connection and serves the latest posts as JSON at
 * `https://feeds.behold.so/<feed id>`, with resized copies of each image on its
 * own CDN.
 *
 * Fetched server-side only, so the browser never talks to Behold — the one
 * thing it loads from them is the images, which is why `imgSrc` in
 * app/entry.server.tsx lists the `behold.pictures` hosts and `connectSrc` does
 * not.
 *
 * Nothing here is allowed to break the homepage. With `BEHOLD_FEED_ID` unset,
 * or Behold slow, down or returning something unexpected, `loadInstagramFeed`
 * resolves to `null` and the section renders nothing at all.
 */
import {CacheLong, type WithCache} from '@shopify/hydrogen';

export type InstagramPost = {
  id: string;
  permalink: string;
  alt: string;
  /** The smallest usable size; `srcSet` offers the larger ones. */
  src: string;
  srcSet?: string;
  width: number;
  height: number;
};

export type InstagramFeed = {
  username: string;
  profileUrl: string;
  posts: InstagramPost[];
};

const FEED_ORIGIN = 'https://feeds.behold.so';
/** Used only if the feed doesn't name its account. */
const FALLBACK_USERNAME = 'sisu_homeware';
/** What the strip shows; also all a free Behold plan returns. */
const MAX_POSTS = 6;
/**
 * Bounds how long a cache miss can hold the section open. The page itself
 * never waits — the homepage streams this in — so this only caps how long the
 * response stays open for it, and how long a crawler waits.
 */
const TIMEOUT_MS = 2500;
/** Small, medium and large: 400 / 700 / 1000px. `full` (2000px) never ships. */
const SRCSET_SIZES = ['small', 'medium', 'large'] as const;
/** Long enough to carry a caption's opening line, short enough to listen to. */
const MAX_ALT_LENGTH = 125;

/**
 * `BEHOLD_FEED_ID` accepts the bare ID or the whole feed URL as copied from
 * Behold's dashboard. Anything else is ignored rather than fetched.
 */
export function beholdFeedUrl(env: Env): string | null {
  const raw = env.BEHOLD_FEED_ID?.trim();
  if (!raw) return null;
  const id = raw
    .replace(/^https?:\/\/feeds\.behold\.so\//i, '')
    .replace(/\/+$/, '');
  return /^[A-Za-z0-9_-]+$/.test(id) ? `${FEED_ORIGIN}/${id}` : null;
}

/**
 * The latest posts, or `null` when there is nothing to show. Never rejects.
 *
 * Cached with `CacheLong` — fresh for an hour, then served stale for up to a
 * further 23 while it refreshes in the background — so a new post appears
 * within about an hour and Behold is asked at most hourly. Failures are not
 * cached: the next request simply tries again.
 */
export async function loadInstagramFeed(context: {
  env: Env;
  withCache: WithCache;
}): Promise<InstagramFeed | null> {
  const url = beholdFeedUrl(context.env);
  if (!url) return null;

  try {
    return await context.withCache.run(
      {
        cacheKey: ['behold-feed', url],
        cacheStrategy: CacheLong(),
        shouldCacheResult: (feed) => feed !== null,
      },
      async ({addDebugData}) => {
        const response = await fetch(url, {
          headers: {accept: 'application/json'},
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        addDebugData({displayName: 'Behold Instagram feed', response});
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const feed = toInstagramFeed(await response.json());
        if (!feed) throw new Error('unexpected response shape');
        return feed;
      },
    );
  } catch (error) {
    // The only trace a misconfigured feed ID leaves: the section just isn't there.
    console.warn(
      `[instagram] Behold feed unavailable: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return null;
  }
}

type Json = Record<string, unknown>;

function isRecord(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Behold's documented response is an object with `username` and `posts`; see
 * https://behold.so/docs/json-feeds. Every field is checked rather than trusted,
 * because it ends up in `href` and `src` attributes.
 *
 * Posts keep the feed's order — Instagram's own grid order, which is newest
 * first unless a post has been pinned or the grid rearranged, i.e. what the
 * profile itself shows.
 */
function toInstagramFeed(json: unknown): InstagramFeed | null {
  if (!isRecord(json) || !Array.isArray(json.posts)) return null;

  const username =
    typeof json.username === 'string' &&
    /^[A-Za-z0-9._]{1,30}$/.test(json.username)
      ? json.username
      : FALLBACK_USERNAME;

  const posts = json.posts
    .map((post) => toInstagramPost(post, username))
    .filter((post): post is InstagramPost => post !== null)
    .slice(0, MAX_POSTS);

  return {
    username,
    profileUrl: `https://www.instagram.com/${username}/`,
    posts,
  };
}

function toInstagramPost(raw: unknown, username: string): InstagramPost | null {
  if (!isRecord(raw)) return null;
  // Undocumented, but every post in Behold's live example feed carries
  // `"visibility": "visible"`. Anything else is not for public display.
  if (raw.visibility !== undefined && raw.visibility !== 'visible') return null;

  const id = typeof raw.id === 'string' ? raw.id : null;
  const permalink = instagramUrl(raw.permalink);
  if (!id || !permalink) return null;

  // For VIDEO posts (reels included) Behold fills `sizes` from the thumbnail;
  // an album's own `sizes` is its cover, with the first slide as a fallback.
  // A post with neither is skipped — `mediaUrl` would be the video itself, or
  // an expiring Instagram CDN URL that CSP doesn't allow.
  const firstChild = Array.isArray(raw.children) ? raw.children[0] : undefined;
  const image =
    toImage(raw.sizes) ??
    (isRecord(firstChild) ? toImage(firstChild.sizes) : null);
  if (!image) return null;

  return {
    id,
    permalink,
    alt: altText(raw) ?? `A post by @${username} on Instagram`,
    ...image,
  };
}

/** Only links to Instagram itself are ever rendered. */
function instagramUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === 'https:' &&
      (host === 'instagram.com' || host.endsWith('.instagram.com'))
      ? url.href
      : null;
  } catch {
    return null;
  }
}

/**
 * Only images on Behold's CDN — the hosts `imgSrc` allows. The live feed uses
 * the bare `behold.pictures`; Behold's documentation also shows `cdn.` and
 * `cdn2.` subdomains.
 */
function beholdImageUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === 'https:' &&
      (host === 'behold.pictures' || host.endsWith('.behold.pictures'))
      ? url.href
      : null;
  } catch {
    return null;
  }
}

const positiveInt = (value: unknown): number | null =>
  typeof value === 'number' && Number.isInteger(value) && value > 0
    ? value
    : null;

function toImage(
  sizes: unknown,
): Pick<InstagramPost, 'src' | 'srcSet' | 'width' | 'height'> | null {
  if (!isRecord(sizes)) return null;

  const candidates = SRCSET_SIZES.flatMap((key) => {
    const size = sizes[key];
    if (!isRecord(size)) return [];
    const src = beholdImageUrl(size.mediaUrl);
    if (!src) return [];
    return [
      {src, width: positiveInt(size.width), height: positiveInt(size.height)},
    ];
  });
  const smallest = candidates[0];
  if (!smallest) return null;

  // Behold's types allow null dimensions; a size without a width can't take a
  // `w` descriptor, and the tile is square whatever the photo's shape, so the
  // attributes below are only a ratio hint.
  const srcSet = candidates
    .filter((c) => c.width !== null)
    .map((c) => `${c.src} ${c.width}w`)
    .join(', ');

  return {
    src: smallest.src,
    srcSet: srcSet || undefined,
    width: smallest.width ?? 400,
    height: smallest.height ?? 400,
  };
}

/**
 * Instagram's own alt text when the account wrote one, otherwise the caption
 * with hashtags already stripped by Behold, flattened and trimmed to a
 * sentence-ish length at a word boundary.
 */
function altText(post: Json): string | null {
  for (const field of ['altText', 'prunedCaption'] as const) {
    const value = post[field];
    if (typeof value !== 'string') continue;
    const text = value.replace(/\s+/g, ' ').trim();
    if (!text) continue;
    if (text.length <= MAX_ALT_LENGTH) return text;
    const cut = text.slice(0, MAX_ALT_LENGTH);
    const lastSpace = cut.lastIndexOf(' ');
    return `${(lastSpace > 60 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:–—-]+$/, '')}…`;
  }
  return null;
}
