/**
 * Submit every URL in the live sitemap to IndexNow, which shares it with Bing,
 * Yandex, Seznam, Naver and the other participating engines.
 *
 *   npm run indexnow               # submit
 *   npm run indexnow -- --dry-run  # fetch and print the payload, submit nothing
 *
 * Run it from production only: IndexNow verifies the submission by fetching
 * the key file from the brand domain, so the key route
 * (`app/routes/[<key>.txt].tsx`) has to be deployed to `main` first. The
 * script checks that before it posts anything.
 *
 * Worth re-running after a batch of new products, articles or pages.
 * Resubmitting unchanged URLs gains nothing, and Google does not take part in
 * IndexNow at all.
 */
import {readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const SITE = 'https://sisuhomeware.com';
const ENDPOINT = 'https://api.indexnow.org/indexnow';
/** The protocol's per-request cap. */
const MAX_URLS_PER_REQUEST = 10_000;

/** What each documented IndexNow status means, for the printed result. */
const STATUS_MEANING = {
  200: 'OK, URLs submitted',
  202: 'Accepted, key validation pending',
  400: 'Bad request',
  403: 'Key not valid (key file not found, or its body does not match)',
  422: 'URLs do not belong to the host, or the key does not match the protocol',
  429: 'Too many requests',
};

const dryRun = process.argv.includes('--dry-run');

function print(line = '') {
  process.stdout.write(`${line}\n`);
}

/**
 * The key is the key route's file name, so the route and this script cannot
 * disagree about it.
 */
function findKey() {
  const routes = fileURLToPath(new URL('../app/routes/', import.meta.url));
  const keys = readdirSync(routes)
    .map((file) => /^\[([0-9a-f]{32})\.txt\]\.tsx$/.exec(file)?.[1])
    .filter(Boolean);
  if (keys.length !== 1) {
    throw new Error(
      `Expected one IndexNow key route in app/routes, found ${keys.length}.`,
    );
  }
  return keys[0];
}

const XML_ENTITIES = {amp: '&', lt: '<', gt: '>', quot: '"', apos: "'"};

function locs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((match) =>
    match[1].replace(
      /&(amp|lt|gt|quot|apos);/g,
      (_, name) => XML_ENTITIES[name],
    ),
  );
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`GET ${url} returned ${response.status}.`);
  return response.text();
}

/** Every page URL in a sitemap, following a sitemap index into its children. */
async function sitemapUrls(url, seen = new Set()) {
  if (seen.has(url)) return [];
  seen.add(url);
  const xml = await fetchText(url);
  if (!/<sitemapindex[\s>]/.test(xml)) return locs(xml);
  const urls = [];
  for (const child of locs(xml)) urls.push(...(await sitemapUrls(child, seen)));
  return urls;
}

async function main() {
  const key = findKey();
  const host = new URL(SITE).host;
  const keyLocation = `${SITE}/${key}.txt`;

  // IndexNow refuses the whole submission if it can't read the key back, so
  // find that out here rather than from a 403.
  const keyResponse = await fetch(keyLocation);
  const keyBody = keyResponse.ok ? (await keyResponse.text()).trim() : '';
  if (keyBody !== key) {
    const problem = `${keyLocation} returned ${keyResponse.status}${
      keyResponse.ok ? ' with a different body' : ''
    }: the key route is not live in production yet.`;
    if (!dryRun) throw new Error(`${problem} Deploy it to main first.`);
    console.warn(`Warning: ${problem}`);
  }

  const found = [...new Set(await sitemapUrls(`${SITE}/sitemap.xml`))];
  const urlList = found.filter((url) => new URL(url).host === host);
  if (urlList.length < found.length) {
    console.warn(
      `Skipping ${found.length - urlList.length} sitemap URL(s) not on ${host}.`,
    );
  }
  if (urlList.length === 0)
    throw new Error('The sitemap has no URLs to submit.');

  print(`host:        ${host}`);
  print(`keyLocation: ${keyLocation}`);
  print(`URLs:        ${urlList.length}`);

  if (dryRun) {
    for (const url of urlList) print(`  ${url}`);
    print('\nDry run: nothing submitted.');
    return;
  }

  let failed = false;
  for (let i = 0; i < urlList.length; i += MAX_URLS_PER_REQUEST) {
    const batch = urlList.slice(i, i + MAX_URLS_PER_REQUEST);
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {'content-type': 'application/json; charset=utf-8'},
      body: JSON.stringify({host, key, keyLocation, urlList: batch}),
    });
    const body = (await response.text()).trim();
    const meaning = STATUS_MEANING[response.status] ?? response.statusText;
    print(
      `POST ${ENDPOINT} (${batch.length} URLs): ${response.status} ${meaning}`,
    );
    if (body) print(body);
    if (!response.ok) failed = true;
  }
  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
