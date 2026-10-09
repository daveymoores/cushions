/**
 * The IndexNow key file. IndexNow (Bing, Yandex, Seznam, Naver and the others
 * sharing api.indexnow.org) accepts a URL submission for a host only once it
 * can fetch `/<key>.txt` from that host and read back exactly the key.
 *
 * The key is this file's name — `scripts/indexnow.mjs` reads it from here, so
 * there is no second copy to drift. To rotate it, rename this file and change
 * `KEY` to match; the script checks the live file before it submits anything.
 *
 * A route rather than a file in `public/`, like `/robots.txt`: the app sets
 * the content type and cache lifetime itself instead of inheriting Oxygen's
 * static-asset handling (a one-year `cache-control` on `public/` files; see
 * CLAUDE.md, "Static assets and CSP", for where else that path bites).
 *
 * The key is not a secret. It only proves the submitter controls the host.
 */
const KEY = 'eba79443b09b890dcda1c687ab461b61';

export async function loader() {
  // No trailing newline: the body must be the key and nothing else.
  return new Response(KEY, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'max-age=86400',
    },
  });
}
