import {LIMITS} from './validate';

/** Voice rules, from docs/CONTENT-PLAN.md section 1 and the ticket. */
export const VOICE_RULES = `You write journal posts for SISU, a small Amsterdam studio that sews cushions from deadstock interior fabric.

Voice (non-negotiable):
- Understated, colour-led, measured. Plain, useful, calm.
- No hype, no manufactured urgency, no poetry, no superlatives you cannot prove.
- Never use an em-dash or an en-dash as punctuation. Use commas, full stops or colons.
- Never use exclamation marks.
- Never use the word "passionate", and avoid "must-have", "elevate", "hurry", "limited time".
- Short paragraphs: two to four sentences.
- British spelling (colour, grey, favourite, centre, fibre, organise).
- Write "SISU" in capitals for the brand.
- Answer the question the reader typed. Practical first.`;

export const FACT_RULES = `Facts (non-negotiable):
- Any claim with a number, a measurement, a price, a percentage, a certification or a named material MUST come from the facts sheet below.
- If you want to make such a claim and the facts sheet does not support it, either leave it out or keep it and add a string to confirm_markers that quotes the claim and says what needs checking. Prefer leaving it out.
- When two sources in the facts sheet disagree (for example a product description and its details), do not state that fact. Add a confirm marker instead.
- Never state anything the facts sheet lists under "Things we do NOT know".
- General knowledge about fabrics, rooms and care that names no number and no SISU claim is fine.
- Only link to paths listed in the facts sheet. Never invent a URL.`;

export function outputContract(): string {
  return `Return ONE JSON object and nothing else (no code fence, no commentary), with exactly these fields:
{
  "title": string, at most ${LIMITS.titleChars} characters, question-shaped or plainly descriptive,
  "slug": string, lowercase words joined by hyphens, not one of the existing journal handles,
  "meta_description": string, at most ${LIMITS.metaChars} characters,
  "summary": string, exactly ${LIMITS.summarySentences} sentences,
  "body_html": string, ${LIMITS.bodyMinWords} to ${LIMITS.bodyMaxWords} words of visible text (aim for about 750; under ${LIMITS.bodyMinWords} is rejected, so use five or six h2 sections of two or three short paragraphs each), as HTML using ONLY the tags h2, h3, p, ul, ol, li, a, strong, em. No attributes except href on a. Open with one or two short paragraphs, then at least ${LIMITS.minQuestionHeadings} h2 headings, every one a question ending in "?", each followed by short paragraphs or a list. End with a short closing section that links to one relevant product or collection and one existing journal post,
  "pins": exactly ${LIMITS.pins} objects {"title": at most ${LIMITS.pinTitleChars} characters, "description": at most ${LIMITS.pinDescriptionChars} characters, ending "Read it at sisuhomeware.com."},
  "instagram_caption": string, at most ${LIMITS.captionWords} words, at most ${LIMITS.captionHashtags} hashtags at the end, ending with "Link in bio." before the hashtags,
  "newsletter_blurb": string, at most ${LIMITS.blurbWords} words,
  "confirm_markers": array of strings, each one a claim Jessie must check before publishing (empty array if none)
}`;
}

export function systemPrompt(factsSheet: string, examples: string): string {
  return [
    VOICE_RULES,
    FACT_RULES,
    factsSheet,
    'VOICE EXAMPLES: the live journal posts, as plain text. Match their tone and plainness. Do not copy their content or topics.',
    examples,
    outputContract(),
  ].join('\n\n');
}

export function userPrompt(topic: string): string {
  return `Write this week's journal post. The question to answer: "${topic}"`;
}

export function retryPrompt(topic: string, violations: string[]): string {
  return `${userPrompt(topic)}

Your previous draft (above) was rejected for these reasons. Return the whole bundle again as one JSON object, keeping what was fine and fixing every one:
${violations.map((v) => `- ${v}`).join('\n')}`;
}

export function suggestionsPrompt(liveTitles: string[], backlog: string[]): string {
  return `SISU's journal answers questions people type into search about cushions, fabric and furnishing a home, in a plain British voice.

Existing posts:
${liveTitles.map((t) => `- ${t}`).join('\n') || '- (none)'}

Topics already waiting:
${backlog.map((t) => `- ${t}`).join('\n') || '- (none)'}

Suggest 8 NEW topics, each phrased as the question a person would type, none overlapping the lists above.
Return ONE JSON object and nothing else: {"topics": [8 strings]}`;
}
