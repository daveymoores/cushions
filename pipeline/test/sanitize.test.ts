import {describe, expect, it} from 'vitest';
import {htmlToText, isAllowedHref, sanitizeHtml, stripHtml} from '../src/sanitize';

describe('sanitizeHtml', () => {
  it('keeps the allowed tags as they are', () => {
    const html =
      '<h2>Why?</h2><h3>Sub</h3><p>A <strong>b</strong> <em>c</em></p><ul><li>x</li></ul><ol><li>y</li></ol>';
    expect(sanitizeHtml(html).html).toBe(html);
  });

  it('drops script and style with their content', () => {
    const r = sanitizeHtml('<p>a</p><script>alert(1)</script><style>p{}</style><p>b</p>');
    expect(r.html).toBe('<p>a</p><p>b</p>');
    expect(r.removedTags).toEqual(['script', 'style']);
  });

  it('drops an unclosed script to the end', () => {
    expect(sanitizeHtml('<p>a</p><script>bad()').html).toBe('<p>a</p>');
  });

  it('removes other tags but keeps their text', () => {
    const r = sanitizeHtml('<div><p>Kept <span>text</span></p></div><h1>Title</h1><img src="x.jpg">');
    expect(r.html).toBe('<p>Kept text</p>Title');
    expect(r.removedTags).toEqual(['div', 'h1', 'img', 'span']);
  });

  it('removes every attribute except href on a', () => {
    const r = sanitizeHtml('<p class="x" onclick="evil()">a</p><a href="/journal/x" target="_blank" rel="x">b</a>');
    expect(r.html).toBe('<p>a</p><a href="/journal/x">b</a>');
    expect(r.removedAttributes).toBe(4);
  });

  it('keeps same-origin paths and https URLs', () => {
    expect(sanitizeHtml('<a href="/collections/cushions">c</a>').html).toBe('<a href="/collections/cushions">c</a>');
    expect(sanitizeHtml("<a href='https://downpass.com/'>d</a>").html).toBe('<a href="https://downpass.com/">d</a>');
  });

  it('refuses javascript:, data:, http:, protocol-relative and obfuscated hrefs', () => {
    for (const href of [
      'javascript:alert(1)',
      'data:text/html,x',
      'http://example.com',
      '//evil.com/x',
      '&#106;avascript:alert(1)',
      'java&#x0A;script:alert(1)',
      ' javascript:alert(1)',
      'mailto:a@b.c',
    ]) {
      const r = sanitizeHtml(`<a href="${href}">x</a>`);
      expect(r.html, href).toBe('<a>x</a>');
      expect(r.rejectedHrefs, href).toEqual([href]);
    }
  });

  it('escapes stray angle brackets and bare ampersands in text', () => {
    expect(sanitizeHtml('<p>a < b & c &amp; d > e</p>').html).toBe('<p>a &lt; b &amp; c &amp; d &gt; e</p>');
  });

  it('removes comments', () => {
    expect(sanitizeHtml('<p>a<!-- <script>x</script> --></p>').html).toBe('<p>a</p>');
  });

  it('cannot be tricked by a > inside a quoted attribute', () => {
    expect(sanitizeHtml('<p title="a>b" onclick="x">t</p>').html).toBe('<p>t</p>');
  });
});

describe('isAllowedHref', () => {
  it('accepts only paths and https', () => {
    expect(isAllowedHref('/journal/a')).toBe(true);
    expect(isAllowedHref('https://sisuhomeware.com/journal/a')).toBe(true);
    expect(isAllowedHref('http://sisuhomeware.com')).toBe(false);
    expect(isAllowedHref('#top')).toBe(false);
  });
});

describe('text helpers', () => {
  it('htmlToText gives one block per line', () => {
    expect(htmlToText('<h2>Q?</h2><p>A &amp; B</p><ul><li>x</li><li>y</li></ul>')).toBe('Q?\nA & B\nx\ny');
  });
  it('stripHtml handles the live-post markup', () => {
    expect(stripHtml('<div><p>One<br>Two</p></div><img src="a">')).toBe('One\nTwo');
  });
});
