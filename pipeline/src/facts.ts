import factsFile from '../facts.json';
import type {StorefrontArticle, StorefrontProduct} from './shopify';
import {stripHtml} from './sanitize';

export type Fact = {fact: string; source: string; status: 'confirmed' | 'unknown'};

export const FACTS: Fact[] = factsFile as Fact[];

export type JournalPost = {handle: string; title: string; url: string; published: boolean};

export type FactsSheet = {
  /** The sheet as the model sees it. */
  text: string;
  /** What numbers and names are checked against: confirmed facts plus live product data. */
  corpus: string;
  productHandles: string[];
};

/** Metafield text uses em-dashes; the voice bans them, so do not show the model any. */
function tidy(value: string): string {
  return value.replace(/\s*—\s*/g, ', ').replace(/\s+/g, ' ').trim();
}

function productBlock(p: StorefrontProduct): string {
  const meta = Object.fromEntries(
    p.metafields.filter((m): m is {key: string; value: string} => !!m).map((m) => [m.key, tidy(m.value)]),
  );
  const prices = [...new Set(p.variants.nodes.map((v) => `${Number(v.price.amount)} ${v.price.currencyCode}`))];
  const colours = p.options
    .filter((o) => o.name !== 'Title')
    .map((o) => `${o.name}: ${o.optionValues.map((v) => v.name).join(', ')}`);
  const size = /(\d+)\s*[x×]\s*(\d+)\s*cm/i.exec(p.description);
  const lines = [
    `- ${p.title} (/products/${p.handle})`,
    `  Size (from the description): ${size ? `${size[1]} x ${size[2]} cm` : 'not stated'}`,
    `  Price: ${prices.join(' / ')}`,
    ...(colours.length ? [`  Options: ${colours.join('; ')}`] : []),
    `  Details: front fabric: ${meta.front_fabric ?? 'not set'}; back fabric: ${meta.back_fabric ?? 'not set'}; trim: ${meta.trim ?? 'not set'}; insert: ${meta.insert ?? 'not set'}; care: ${meta.care ?? 'not set'}`,
    `  Description: ${tidy(p.description)}`,
  ];
  return lines.join('\n');
}

export function buildFactsSheet(
  products: StorefrontProduct[],
  posts: JournalPost[],
  facts: Fact[] = FACTS,
): FactsSheet {
  const confirmed = facts.filter((f) => f.status === 'confirmed');
  const unknown = facts.filter((f) => f.status === 'unknown');
  const cushions = products.filter((p) => p.productType === 'Cushion' || /cushion/i.test(p.productType));
  const shown = cushions.length ? cushions : products;

  const text = [
    'FACTS SHEET (built from the live shop today; the only source you may use for any number or named material)',
    '',
    'Confirmed facts about SISU:',
    ...confirmed.map((f) => `- ${f.fact}`),
    '',
    'Things we do NOT know. Never state these; if the article needs one, add a confirm marker instead:',
    ...unknown.map((f) => `- ${f.fact}`),
    '',
    'Products on sale now (from the shop). "Details" and "Description" are separate sources.',
    'If they disagree about something (for example Ember: the description says a mushroom fringe, the details say camel),',
    'do not state that thing; add a confirm marker instead.',
    ...shown.map(productBlock),
    '',
    'Journal posts that already exist (do not repeat them; link to them where useful, using these exact paths):',
    ...posts.map((p) => `- "${p.title}" at /journal/${p.handle}${p.published ? '' : ' (draft, not yet published; do not link)'}`),
    '',
    'Other pages you may link to: /collections/cushions, /journal, /materials, /atelier',
  ].join('\n');

  const corpus = [
    ...confirmed.map((f) => f.fact),
    ...shown.map(productBlock),
    ...posts.map((p) => p.title),
    'SISU',
  ].join('\n');

  return {text, corpus, productHandles: shown.map((p) => p.handle)};
}

/** The live posts as plain text, for the few-shot voice examples. */
export function fewShotExamples(articles: StorefrontArticle[], max = 3): string {
  return articles
    .slice(0, max)
    .map((a, i) => `EXAMPLE ${i + 1}: "${a.title}"\n${stripHtml(a.contentHtml).replace(/\s*—\s*/g, ', ')}`)
    .join('\n\n');
}
