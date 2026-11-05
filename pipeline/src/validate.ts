import type {Bundle} from './bundle';
import {htmlToText, sanitizeHtml, type SanitizeResult} from './sanitize';

/** What the validator checks a bundle against; all of it built at run time. */
export type ValidationContext = {
  /** Every text the facts sheet was built from (facts.json confirmed entries, live product data). */
  factsCorpus: string;
  /** Handles of every existing journal article, published or not. */
  existingSlugs: string[];
  /** Same-origin paths a link may point to, e.g. `/journal/what-is-deadstock-fabric`. */
  knownPaths: string[];
};

export type ValidationResult = {
  ok: boolean;
  violations: string[];
  /** The bundle with `body_html` replaced by its sanitised form. */
  bundle: Bundle;
  sanitize: SanitizeResult;
};

export const LIMITS = {
  titleChars: 60,
  metaChars: 155,
  summarySentences: 2,
  bodyMinWords: 600,
  bodyMaxWords: 900,
  pins: 3,
  pinTitleChars: 100,
  pinDescriptionChars: 500,
  captionWords: 150,
  captionHashtags: 5,
  blurbWords: 80,
  minQuestionHeadings: 3,
} as const;

/** Phrases the voice rules forbid: hype, urgency, and the one word the brief names. */
export const BANNED_PHRASES = [
  'passionate',
  'must-have',
  'must have',
  'hurry',
  "don't miss",
  'do not miss',
  'limited time',
  'act now',
  'while stocks last',
  'game-changer',
  'game changer',
  'elevate your',
];

/** American spellings to catch; the voice is British. */
const AMERICAN_SPELLINGS: Array<[RegExp, string]> = [
  [/\bcolor(s|ful|ed|ing|way|ways)?\b/i, 'colour'],
  [/\bfavorite(s)?\b/i, 'favourite'],
  [/\bgray\b/i, 'grey'],
  [/\bcenter(s|ed)?\b/i, 'centre'],
  [/\bfiber(s)?\b/i, 'fibre'],
  [/\borganiz(e|es|ed|ing|ation)\b/i, 'organis-'],
  [/\bcozy\b/i, 'cosy'],
  [/\bjewelry\b/i, 'jewellery'],
  [/\bneighbor(s|hood)?\b/i, 'neighbour'],
  [/\bfavor(s|ite)?\b/i, 'favour'],
  [/\bmold\b/i, 'mould'],
];

export function wordCount(text: string): number {
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

export function sentences(text: string): string[] {
  return text
    .split(/\n+|(?<=[.?!])\s+(?=[A-Z0-9"'(\[])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Numbers as they would be compared: `150.00` -> `150`, `1,5` -> `1.5`, `1,000` -> `1000`. */
export function numbersIn(text: string): string[] {
  const cleaned = text.replace(/(\d),(\d{3})\b/g, '$1$2');
  return [...cleaned.matchAll(/\d+(?:[.,]\d+)?/g)].map((m) =>
    m[0].replace(',', '.').replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1'),
  );
}

function normalise(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** All human-readable text of a bundle, with the field it came from. */
function textFields(bundle: Bundle, bodyText: string): Array<[string, string]> {
  return [
    ['title', bundle.title],
    ['meta_description', bundle.meta_description],
    ['summary', bundle.summary],
    ['body', bodyText],
    ...bundle.pins.flatMap((pin, i): Array<[string, string]> => [
      [`pins[${i}].title`, pin.title],
      [`pins[${i}].description`, pin.description],
    ]),
    ['instagram_caption', bundle.instagram_caption],
    ['newsletter_blurb', bundle.newsletter_blurb],
  ];
}

export function checkLimits(bundle: Bundle, bodyText: string): string[] {
  const v: string[] = [];
  if (!bundle.title) v.push('title is empty');
  if (bundle.title.length > LIMITS.titleChars) {
    v.push(`title is ${bundle.title.length} characters; the limit is ${LIMITS.titleChars}`);
  }
  if (!bundle.meta_description) v.push('meta_description is empty');
  if (bundle.meta_description.length > LIMITS.metaChars) {
    v.push(`meta_description is ${bundle.meta_description.length} characters; the limit is ${LIMITS.metaChars}`);
  }
  const summaryCount = sentences(bundle.summary).length;
  if (summaryCount !== LIMITS.summarySentences) {
    v.push(`summary has ${summaryCount} sentences; it must have exactly ${LIMITS.summarySentences}`);
  }
  const words = wordCount(bodyText);
  if (words < LIMITS.bodyMinWords || words > LIMITS.bodyMaxWords) {
    v.push(`body is ${words} words; it must be ${LIMITS.bodyMinWords} to ${LIMITS.bodyMaxWords}`);
  }
  if (bundle.pins.length !== LIMITS.pins) v.push(`there are ${bundle.pins.length} pins; there must be ${LIMITS.pins}`);
  bundle.pins.forEach((pin, i) => {
    if (!pin.title || pin.title.length > LIMITS.pinTitleChars) {
      v.push(`pins[${i}].title is ${pin.title.length} characters; it must be 1 to ${LIMITS.pinTitleChars}`);
    }
    if (!pin.description || pin.description.length > LIMITS.pinDescriptionChars) {
      v.push(
        `pins[${i}].description is ${pin.description.length} characters; it must be 1 to ${LIMITS.pinDescriptionChars}`,
      );
    }
  });
  const captionWords = wordCount(bundle.instagram_caption);
  if (!captionWords || captionWords > LIMITS.captionWords) {
    v.push(`instagram_caption is ${captionWords} words; it must be 1 to ${LIMITS.captionWords}`);
  }
  const hashtags = bundle.instagram_caption.match(/#[\p{L}\p{N}_]+/gu) ?? [];
  if (hashtags.length > LIMITS.captionHashtags) {
    v.push(`instagram_caption has ${hashtags.length} hashtags; the limit is ${LIMITS.captionHashtags}`);
  }
  const blurbWords = wordCount(bundle.newsletter_blurb);
  if (!blurbWords || blurbWords > LIMITS.blurbWords) {
    v.push(`newsletter_blurb is ${blurbWords} words; it must be 1 to ${LIMITS.blurbWords}`);
  }
  return v;
}

export function checkSlug(slug: string, existingSlugs: string[]): string[] {
  const v: string[] = [];
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    v.push(`slug "${slug}" must be lowercase words joined by single hyphens`);
  }
  if (slug.length > 80) v.push(`slug is ${slug.length} characters; keep it under 80`);
  if (existingSlugs.includes(slug)) v.push(`slug "${slug}" is already used by an existing journal article`);
  return v;
}

export function checkHeadings(html: string): string[] {
  const v: string[] = [];
  const h2s = [...html.matchAll(/<h2>([\s\S]*?)<\/h2>/g)].map((m) => htmlToText(m[1] ?? ''));
  if (h2s.length < LIMITS.minQuestionHeadings) {
    v.push(`body has ${h2s.length} h2 headings; it needs at least ${LIMITS.minQuestionHeadings}, each a question`);
  }
  for (const h of h2s) if (!h.trim().endsWith('?')) v.push(`h2 "${h}" is not a question (must end with "?")`);
  return v;
}

export function checkBannedText(fields: Array<[string, string]>): string[] {
  const v: string[] = [];
  for (const [field, text] of fields) {
    if (text.includes('—')) v.push(`${field} contains an em-dash`);
    if (/\s–\s/.test(text)) v.push(`${field} uses an en-dash as a dash`);
    if (text.includes('!')) v.push(`${field} contains an exclamation mark`);
    const lower = text.toLowerCase();
    for (const phrase of BANNED_PHRASES) {
      if (lower.includes(phrase)) v.push(`${field} contains the banned phrase "${phrase}"`);
    }
    for (const [pattern, british] of AMERICAN_SPELLINGS) {
      const hit = pattern.exec(text);
      if (hit) v.push(`${field} uses the American spelling "${hit[0]}" (use ${british})`);
    }
  }
  return v;
}

/**
 * Every sentence with a digit must be sourced: each of its numbers appears in
 * the facts corpus, or a confirm marker carries that number, or the sentence
 * quotes a confirm marker.
 */
export function checkNumbers(
  fields: Array<[string, string]>,
  factsCorpus: string,
  confirmMarkers: string[],
): string[] {
  const v: string[] = [];
  const known = new Set(numbersIn(factsCorpus.replace(/×/g, ' x ')));
  const markerNumbers = new Set(confirmMarkers.flatMap((m) => numbersIn(m)));
  const markerTexts = confirmMarkers.map(normalise).filter((m) => m.length >= 8);
  for (const [field, text] of fields) {
    // Hashtags are not claims.
    const prose = text.replace(/#[\p{L}\p{N}_]+/gu, '');
    for (const sentence of sentences(prose)) {
      const numbers = numbersIn(sentence.replace(/×/g, ' x '));
      if (!numbers.length) continue;
      const n = normalise(sentence);
      if (markerTexts.some((m) => n.includes(m) || m.includes(n))) continue;
      const unsourced = numbers.filter((num) => !known.has(num) && !markerNumbers.has(num));
      if (unsourced.length) {
        v.push(
          `${field}: number(s) ${unsourced.join(', ')} not in the facts sheet or confirm_markers: "${sentence}"`,
        );
      }
    }
  }
  return v;
}

/** Upper-case names (certifications, standards, brands) must come from the facts or a marker. */
export function checkNamedTerms(
  fields: Array<[string, string]>,
  factsCorpus: string,
  confirmMarkers: string[],
): string[] {
  const v: string[] = [];
  const markers = confirmMarkers.join(' ');
  const seen = new Set<string>();
  for (const [field, text] of fields) {
    for (const m of text.replace(/#[\p{L}\p{N}_]+/gu, '').matchAll(/\b[A-Z][A-Z0-9]+(?:-[A-Z0-9]+)*\b/g)) {
      const term = m[0];
      if (term.length < 3 || seen.has(term)) continue;
      seen.add(term);
      if (!factsCorpus.includes(term) && !markers.includes(term)) {
        v.push(`${field}: "${term}" is not in the facts sheet; source it or add a confirm marker`);
      }
    }
  }
  return v;
}

export function checkLinks(html: string, knownPaths: string[], rejectedHrefs: string[]): string[] {
  const v: string[] = rejectedHrefs.map((href) => `link "${href}" was removed: only site paths and https URLs are allowed`);
  const known = new Set(knownPaths.map((p) => p.replace(/\/+$/, '') || '/'));
  for (const m of html.matchAll(/<a href="([^"]*)">/g)) {
    const href = (m[1] ?? '').replace(/&amp;/g, '&');
    if (!href.startsWith('/')) continue;
    const path = (href.split(/[?#]/)[0] ?? '').replace(/\/+$/, '') || '/';
    if (!known.has(path)) v.push(`link "${href}" does not point to a page that exists`);
  }
  return v;
}

/**
 * The voice bans dashes as punctuation and the model keeps producing them
 * whatever the prompt says (both dry runs on 2026-11-05). A spaced dash is
 * replaced with a comma rather than rejecting the whole draft; a non-breaking
 * hyphen becomes a plain one. Unspaced en-dashes (ranges such as 50–60) stay.
 */
export function normaliseDashes(text: string): string {
  return text
    .replace(/\u2011/g, '-')
    .replace(/\s*—\s*/g, ', ')
    .replace(/\s+–\s+/g, ', ')
    .replace(/,\s*,/g, ',');
}

export function normaliseBundle(raw: Bundle): Bundle {
  return {
    ...raw,
    title: normaliseDashes(raw.title),
    meta_description: normaliseDashes(raw.meta_description),
    summary: normaliseDashes(raw.summary),
    body_html: normaliseDashes(raw.body_html),
    pins: raw.pins.map((pin) => ({title: normaliseDashes(pin.title), description: normaliseDashes(pin.description)})),
    instagram_caption: normaliseDashes(raw.instagram_caption),
    newsletter_blurb: normaliseDashes(raw.newsletter_blurb),
  };
}

export function validateBundle(input: Bundle, ctx: ValidationContext): ValidationResult {
  const raw = normaliseBundle(input);
  const sanitize = sanitizeHtml(raw.body_html);
  const bundle: Bundle = {...raw, body_html: sanitize.html};
  const bodyText = htmlToText(sanitize.html);
  const fields = textFields(bundle, bodyText);
  const violations = [
    ...checkLimits(bundle, bodyText),
    ...checkSlug(bundle.slug, ctx.existingSlugs),
    ...checkHeadings(sanitize.html),
    ...checkBannedText(fields),
    ...checkNumbers(fields, ctx.factsCorpus, bundle.confirm_markers),
    ...checkNamedTerms(fields, ctx.factsCorpus, bundle.confirm_markers),
    ...checkLinks(sanitize.html, ctx.knownPaths, sanitize.rejectedHrefs),
  ];
  return {ok: violations.length === 0, violations, bundle, sanitize};
}
