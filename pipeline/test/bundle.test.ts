import {describe, expect, it} from 'vitest';
import {extractJsonObject, extractModelText, parseBundle} from '../src/bundle';

const BUNDLE = {
  title: 'T',
  slug: 's',
  meta_description: 'm',
  summary: 'a. b.',
  body_html: '<p>x {not json} "quoted" \\ back</p>',
  pins: [{title: 'p', description: 'd'}],
  instagram_caption: 'c',
  newsletter_blurb: 'n',
  confirm_markers: ['check this', '', 3],
};
const TEXT = JSON.stringify(BUNDLE);

describe('extractModelText', () => {
  it('reads the llama shape {response}', () => {
    expect(extractModelText({response: TEXT})).toBe(TEXT);
  });
  it('reads a pre-parsed llama JSON response', () => {
    expect(JSON.parse(extractModelText({response: BUNDLE}))).toEqual(BUNDLE);
  });
  it('reads the chat-completions shape {choices}', () => {
    expect(extractModelText({choices: [{message: {content: TEXT}}]})).toBe(TEXT);
  });
  it('reads the responses shape and skips reasoning', () => {
    const raw = {
      output: [
        {type: 'reasoning', content: [{type: 'reasoning_text', text: 'thinking {'}]},
        {type: 'message', content: [{type: 'output_text', text: TEXT}]},
      ],
    };
    expect(extractModelText(raw)).toBe(TEXT);
    expect(extractModelText({output_text: TEXT})).toBe(TEXT);
  });
  it('names the keys when it finds no text', () => {
    expect(() => extractModelText({usage: {}})).toThrow(/keys: usage/);
  });
});

describe('extractJsonObject', () => {
  it('handles a json code fence', () => {
    expect(extractJsonObject('```json\n' + TEXT + '\n```')).toEqual(BUNDLE);
  });
  it('handles leading prose and trailing text', () => {
    expect(extractJsonObject(`Here is the bundle:\n${TEXT}\nHope this helps {ok}`)).toEqual(BUNDLE);
  });
  it('is not fooled by braces inside strings', () => {
    expect(extractJsonObject('{"a": "}{", "b": {"c": 1}} trailing }')).toEqual({a: '}{', b: {c: 1}});
  });
  it('repairs trailing commas', () => {
    expect(extractJsonObject('{"a": [1, 2,], "b": "x",\n}')).toEqual({a: [1, 2], b: 'x'});
  });
  it('shows where an unrepairable reply broke', () => {
    expect(() => extractJsonObject('{\n  title: "unquoted key"\n}')).toThrow(/did not parse.*near: \{ title/);
  });
  it('reports a cut-off reply', () => {
    expect(() => extractJsonObject(TEXT.slice(0, 40))).toThrow(/not closed/);
  });
  it('reports no JSON at all', () => {
    expect(() => extractJsonObject('Sorry, I cannot help.')).toThrow(/no JSON object/);
  });
});

describe('parseBundle', () => {
  it('parses a full reply and drops non-string or empty markers', () => {
    const b = parseBundle({response: TEXT});
    expect(b.title).toBe('T');
    expect(b.body_html).toBe(BUNDLE.body_html);
    expect(b.confirm_markers).toEqual(['check this']);
  });
  it('lists every missing field', () => {
    expect(() => parseBundle({response: '{"title": "x"}'})).toThrow(/pins is missing.*slug is missing.*body_html is missing.*newsletter_blurb is missing/);
  });
  it('rejects the old body_markdown shape', () => {
    const old = {...BUNDLE, body_html: undefined, body_markdown: '# hi'};
    expect(() => parseBundle({response: JSON.stringify(old)})).toThrow(/body_html is missing/);
  });
});
