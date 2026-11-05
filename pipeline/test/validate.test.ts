import {normaliseDashes} from '../src/validate';
import {describe, expect, it} from 'vitest';
import type {Bundle} from '../src/bundle';
import {
  checkBannedText,
  checkHeadings,
  checkLimits,
  checkLinks,
  checkNamedTerms,
  checkNumbers,
  checkSlug,
  numbersIn,
  validateBundle,
  type ValidationContext,
} from '../src/validate';
import {htmlToText} from '../src/sanitize';

const SENTENCE = 'A cushion looks best when the cover is full and the colour sits calmly in the room.';

function paragraphs(words: number): string {
  const perSentence = SENTENCE.split(' ').length;
  const count = Math.ceil(words / perSentence);
  const out: string[] = [];
  for (let i = 0; i < count; i += 3) out.push(`<p>${Array(Math.min(3, count - i)).fill(SENTENCE).join(' ')}</p>`);
  return out.join('');
}

function body(words = 700): string {
  const third = Math.floor(words / 3) - 4;
  return [
    '<h2>What size should a cushion be?</h2>',
    paragraphs(third),
    '<h2>How full should it look?</h2>',
    paragraphs(third),
    '<h2>Where do you start?</h2>',
    paragraphs(third),
    '<p>See <a href="/journal/what-is-deadstock-fabric">what deadstock fabric is</a>.</p>',
  ].join('');
}

function good(overrides: Partial<Bundle> = {}): Bundle {
  return {
    title: 'How full should a cushion look?',
    slug: 'how-full-should-a-cushion-look',
    meta_description: 'A plain guide to cushion fullness.',
    summary: 'A full cushion looks calmer. Here is how to get there.',
    body_html: body(),
    pins: [
      {title: 'Pin one', description: 'One.'},
      {title: 'Pin two', description: 'Two.'},
      {title: 'Pin three', description: 'Three.'},
    ],
    instagram_caption: 'A full cushion. Link in bio. #cushions #interiors',
    newsletter_blurb: 'Our new guide on cushion fullness.',
    confirm_markers: [],
    ...overrides,
  };
}

const ctx: ValidationContext = {
  factsCorpus:
    'A 50 x 50 cm SISU cover comes with a 55 cm insert. Covers are sewn with 1.5 cm seams. Price: 150 EUR. OEKO-TEX STANDARD 100. DOWNPASS.',
  existingSlugs: ['what-is-deadstock-fabric', 'how-a-sisu-cushion-is-made'],
  knownPaths: ['/journal/what-is-deadstock-fabric', '/collections/cushions', '/products/ada'],
};

describe('validateBundle', () => {
  it('passes a bundle that follows every rule', () => {
    const r = validateBundle(good(), ctx);
    expect(r.violations).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it('sanitises body_html before checking, and returns the clean html', () => {
    const r = validateBundle(good({body_html: `<div onclick="x">${body()}</div><script>bad()</script>`}), ctx);
    expect(r.ok).toBe(true);
    expect(r.bundle.body_html).not.toContain('<div');
    expect(r.bundle.body_html).not.toContain('script');
    expect(r.sanitize.removedTags).toEqual(['div', 'script']);
  });
});

describe('limits', () => {
  const v = (b: Bundle) => checkLimits(b, htmlToText(b.body_html));
  it('title over 60 characters', () => {
    expect(v(good({title: 'x'.repeat(61)}))).toEqual(['title is 61 characters; the limit is 60']);
  });
  it('meta description over 155 characters', () => {
    expect(v(good({meta_description: 'x'.repeat(156)}))[0]).toMatch(/meta_description is 156/);
  });
  it('summary must be exactly two sentences', () => {
    expect(v(good({summary: 'One sentence only.'}))[0]).toMatch(/summary has 1 sentences/);
    expect(v(good({summary: 'One. Two. Three.'}))[0]).toMatch(/summary has 3 sentences/);
  });
  it('body word count 600 to 900', () => {
    expect(v(good({body_html: body(400)}))[0]).toMatch(/body is \d+ words/);
    expect(v(good({body_html: body(1200)}))[0]).toMatch(/body is \d+ words/);
  });
  it('exactly three pins, each within limits', () => {
    expect(v(good({pins: [{title: 'a', description: 'b'}]}))).toEqual(['there are 1 pins; there must be 3']);
    const long = good();
    long.pins[1] = {title: 'x'.repeat(101), description: 'y'.repeat(501)};
    expect(v(long)).toHaveLength(2);
  });
  it('caption word and hashtag limits', () => {
    expect(v(good({instagram_caption: 'word '.repeat(151)}))[0]).toMatch(/151 words/);
    expect(v(good({instagram_caption: 'Hi #a #b #c #d #e #f'}))[0]).toMatch(/6 hashtags/);
  });
  it('newsletter blurb word limit', () => {
    expect(v(good({newsletter_blurb: 'word '.repeat(81)}))[0]).toMatch(/newsletter_blurb is 81 words/);
  });
});

describe('slug', () => {
  it('must be lowercase hyphenated', () => {
    expect(checkSlug('Bad Slug', [])).toHaveLength(1);
    expect(checkSlug('bad--slug', [])).toHaveLength(1);
    expect(checkSlug('good-slug', [])).toEqual([]);
  });
  it('must not match an existing article, drafts included', () => {
    expect(checkSlug('what-is-deadstock-fabric', ctx.existingSlugs)[0]).toMatch(/already used/);
  });
});

describe('headings', () => {
  it('needs at least three h2s, each a question', () => {
    expect(checkHeadings('<h2>One?</h2><h2>Two?</h2>')[0]).toMatch(/2 h2 headings/);
    expect(checkHeadings('<h2>One?</h2><h2>Two?</h2><h2>Three</h2>')).toEqual([
      'h2 "Three" is not a question (must end with "?")',
    ]);
  });
});

describe('banned characters and phrases', () => {
  it('em-dash, spaced en-dash, exclamation mark', () => {
    expect(checkBannedText([['body', 'Soft — and full']])).toEqual(['body contains an em-dash']);
    expect(checkBannedText([['body', 'Soft – and full']])).toEqual(['body uses an en-dash as a dash']);
    expect(checkBannedText([['title', 'Lovely!']])).toEqual(['title contains an exclamation mark']);
  });
  it('allows an unspaced en-dash in a range', () => {
    expect(checkBannedText([['body', 'Two–three cushions']])).toEqual([]);
  });
  it('hype and urgency phrases', () => {
    expect(checkBannedText([['body', 'We are Passionate about it']])[0]).toMatch(/passionate/);
    expect(checkBannedText([['body', 'A must-have for autumn']])[0]).toMatch(/must-have/);
    expect(checkBannedText([['body', 'Hurry, while stocks last']])).toHaveLength(2);
  });
  it('American spellings', () => {
    expect(checkBannedText([['body', 'A gray sofa in a neutral color']])).toHaveLength(2);
    expect(checkBannedText([['body', 'A grey sofa in a neutral colour']])).toEqual([]);
  });
});

describe('numbers', () => {
  it('normalises number tokens', () => {
    expect(numbersIn('50 × 50cm, 1.50 m, 150.00 EUR, 1,000 pieces, 46%')).toEqual(['50', '50', '1.5', '150', '1000', '46']);
  });
  it('passes numbers that are in the facts', () => {
    expect(checkNumbers([['body', 'A 50 × 50cm cover takes a 55cm insert.']], ctx.factsCorpus, [])).toEqual([]);
    expect(checkNumbers([['body', 'Seams are 1.5 cm.']], ctx.factsCorpus, [])).toEqual([]);
  });
  it('flags a sentence with an unsourced number', () => {
    const v = checkNumbers([['body', 'Fine. A 60 × 40cm cover takes a 65cm insert.']], ctx.factsCorpus, []);
    expect(v).toHaveLength(1);
    expect(v[0]).toMatch(/60, 40, 65/);
  });
  it('accepts the number when a confirm marker carries it', () => {
    expect(
      checkNumbers([['body', 'A 60 × 40cm cover takes a 65cm insert.']], ctx.factsCorpus, [
        'Insert size for 60 x 40 cm covers: is it 65 cm?',
      ]),
    ).toEqual([]);
  });
  it('accepts the sentence when a confirm marker quotes it', () => {
    expect(
      checkNumbers([['body', 'Most people use 3 cushions.']], ctx.factsCorpus, ['Most people use 3 cushions']),
    ).toEqual([]);
  });
  it('ignores hashtags', () => {
    expect(checkNumbers([['instagram_caption', 'New post. #home2026']], ctx.factsCorpus, [])).toEqual([]);
  });
});

describe('named terms', () => {
  it('flags an upper-case certification that is not in the facts', () => {
    expect(checkNamedTerms([['body', 'Certified to GOTS and OEKO-TEX.']], ctx.factsCorpus, [])).toEqual([
      'body: "GOTS" is not in the facts sheet; source it or add a confirm marker',
    ]);
  });
  it('accepts it when a confirm marker names it', () => {
    expect(checkNamedTerms([['body', 'Certified to GOTS.']], ctx.factsCorpus, ['Is the fabric GOTS certified?'])).toEqual([]);
  });
});

describe('links', () => {
  it('flags internal links to pages that do not exist', () => {
    expect(checkLinks('<a href="/journal/made-up">x</a>', ctx.knownPaths, [])).toEqual([
      'link "/journal/made-up" does not point to a page that exists',
    ]);
  });
  it('accepts known paths, with a trailing slash or fragment', () => {
    expect(checkLinks('<a href="/collections/cushions/">x</a><a href="/products/ada#d">y</a>', ctx.knownPaths, [])).toEqual([]);
  });
  it('reports hrefs the sanitiser refused', () => {
    expect(checkLinks('<a>x</a>', ctx.knownPaths, ['javascript:x'])[0]).toMatch(/javascript:x/);
  });
});

describe('normaliseDashes', () => {
  it('replaces spaced dashes with commas and non-breaking hyphens with plain ones', () => {
    expect(normaliseDashes('Soft – and full')).toBe('Soft, and full');
    expect(normaliseDashes('Soft — and full')).toBe('Soft, and full');
    expect(normaliseDashes('Soft—and full')).toBe('Soft, and full');
    expect(normaliseDashes('OEKO\u2011TEX')).toBe('OEKO-TEX');
  });
  it('keeps an unspaced en-dash in a range', () => {
    expect(normaliseDashes('50–60 cm')).toBe('50–60 cm');
  });
  it('does not double a comma', () => {
    expect(normaliseDashes('Soft, – and full')).toBe('Soft, and full');
  });
});
