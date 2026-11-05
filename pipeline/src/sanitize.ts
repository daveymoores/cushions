/**
 * The model writes `body_html` directly; this is the only gate between that
 * text and Shopify. Allowed: h2, h3, p, ul, ol, li, a, strong, em. Every other
 * tag is removed (its text kept, except for script-like tags, whose content
 * goes too). Every attribute is removed except `href` on <a>, and that only
 * when it is a same-origin path (`/journal/...`) or an https URL.
 */
export const ALLOWED_TAGS = new Set(['h2', 'h3', 'p', 'ul', 'ol', 'li', 'a', 'strong', 'em']);

/** Tags whose content is dropped with them, not kept as text. */
const DROP_WITH_CONTENT = [
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'template',
  'noscript',
  'svg',
  'math',
  'head',
  'title',
  'textarea',
  'select',
];

export type SanitizeResult = {
  html: string;
  /** Distinct tag names that were removed. */
  removedTags: string[];
  /** Count of attributes removed (including rejected hrefs). */
  removedAttributes: number;
  /** href values that were refused. */
  rejectedHrefs: string[];
};

function decodeEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);?/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function encodeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Same-origin path or https URL, after entity decoding; nothing else. */
export function isAllowedHref(raw: string): boolean {
  const href = decodeEntities(raw).trim();
  // Control characters and whitespace are how scheme filters get dodged.
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f\s\\]/.test(href)) return false;
  if (/^\/(?!\/)/.test(href)) return true;
  if (/^https:\/\//i.test(href)) {
    try {
      return new URL(href).protocol === 'https:';
    } catch {
      return false;
    }
  }
  return false;
}

function readHref(attributes: string): string | null {
  const match = /(?:^|\s)href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i.exec(attributes);
  if (!match) return null;
  return match[1] ?? match[2] ?? match[3] ?? '';
}

function countAttributes(attributes: string): number {
  return (attributes.match(/[^\s"'=<>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?/g) ?? []).length;
}

/** Escape text so a stray `<` or `>` can never open a tag. Existing entities are kept. */
function escapeText(text: string): string {
  return text.replace(/&(?!(?:[a-z]+|#\d+|#x[0-9a-f]+);)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function sanitizeHtml(input: string): SanitizeResult {
  const removedTags = new Set<string>();
  let removedAttributes = 0;
  const rejectedHrefs: string[] = [];

  let html = input.replace(/<!--[\s\S]*?(?:-->|$)/g, '');
  for (const tag of DROP_WITH_CONTENT) {
    const paired = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?(?:<\\/${tag}\\s*>|$)`, 'gi');
    html = html.replace(paired, () => {
      removedTags.add(tag);
      return '';
    });
    const lone = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi');
    html = html.replace(lone, () => {
      removedTags.add(tag);
      return '';
    });
  }

  const tagPattern = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
  let out = '';
  let last = 0;
  for (const match of html.matchAll(tagPattern)) {
    out += escapeText(html.slice(last, match.index));
    last = match.index + match[0].length;
    const closing = match[1] === '/';
    const name = (match[2] ?? '').toLowerCase();
    const attributes = (match[3] ?? '').replace(/\/\s*$/, '');

    if (!ALLOWED_TAGS.has(name)) {
      removedTags.add(name);
      continue;
    }
    if (closing) {
      out += `</${name}>`;
      continue;
    }
    const total = countAttributes(attributes);
    if (name === 'a') {
      const href = readHref(attributes);
      if (href !== null && isAllowedHref(href)) {
        removedAttributes += total - 1;
        out += `<a href="${encodeAttribute(decodeEntities(href).trim())}">`;
      } else {
        if (href !== null) rejectedHrefs.push(href);
        removedAttributes += total;
        out += '<a>';
      }
      continue;
    }
    removedAttributes += total;
    out += `<${name}>`;
  }
  out += escapeText(html.slice(last));

  return {html: out.trim(), removedTags: [...removedTags].sort(), removedAttributes, rejectedHrefs};
}

/** Visible text of sanitised HTML, one block per line. */
export function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<\/(h2|h3|p|li|ul|ol)>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n+/g, '\n'),
  ).trim();
}

/** Text of an arbitrary HTML document (used for the live posts in the few-shot). */
export function stripHtml(html: string): string {
  const blocks = html.replace(/<br\s*\/?>|<\/(?:div|section|blockquote|h1|h4|h5|h6)>/gi, '</p><p>');
  return htmlToText(sanitizeHtml(blocks).html);
}
