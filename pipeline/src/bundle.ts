/**
 * The bundle the model returns. Same parts as the hand-written drafts in
 * docs/journal-drafts/ (title, slug, meta description, index summary, article,
 * three pins, Instagram caption, newsletter blurb), with the article as HTML.
 */
export type Pin = {title: string; description: string};

export type Bundle = {
  title: string;
  slug: string;
  meta_description: string;
  summary: string;
  body_html: string;
  pins: Pin[];
  instagram_caption: string;
  newsletter_blurb: string;
  confirm_markers: string[];
};

/** Pull the text out of whatever shape a Workers AI text model returned. */
export function extractModelText(raw: unknown): string {
  if (typeof raw === 'string') return raw;
  if (!raw || typeof raw !== 'object') throw new Error('Model returned no output.');
  const r = raw as Record<string, unknown>;

  // Llama-style: {response: "..."} (an object when JSON mode parsed it already).
  if (typeof r.response === 'string') return r.response;
  if (r.response && typeof r.response === 'object') return JSON.stringify(r.response);

  // Chat-completions style: {choices: [{message: {content}}]}.
  const choices = r.choices as Array<{message?: {content?: unknown}; text?: unknown}> | undefined;
  if (Array.isArray(choices) && choices[0]) {
    const content = choices[0].message?.content ?? choices[0].text;
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content.map((part) => (part && typeof part === 'object' ? String((part as {text?: unknown}).text ?? '') : '')).join('');
    }
  }

  // Responses style: {output_text} or {output: [{type: "message", content: [{type: "output_text", text}]}]}.
  if (typeof r.output_text === 'string') return r.output_text;
  if (Array.isArray(r.output)) {
    const texts: string[] = [];
    for (const item of r.output as Array<{type?: string; content?: Array<{type?: string; text?: string}>}>) {
      if (item?.type === 'reasoning') continue;
      for (const part of item?.content ?? []) {
        if (typeof part?.text === 'string' && part.type !== 'reasoning_text') texts.push(part.text);
      }
    }
    if (texts.length) return texts.join('');
  }
  throw new Error(`Model output had no text (keys: ${Object.keys(r).join(', ') || 'none'}).`);
}

/**
 * The first balanced JSON object in a reply, ignoring code fences, leading
 * prose and anything after the closing brace.
 */
export function extractJsonObject(text: string): unknown {
  const unfenced = text.replace(/```(?:json)?/gi, '');
  const start = unfenced.indexOf('{');
  if (start === -1) throw new Error('Model reply contained no JSON object.');
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < unfenced.length; i++) {
    const ch = unfenced[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        const candidate = unfenced.slice(start, i + 1);
        try {
          return JSON.parse(candidate);
        } catch (error) {
          // The one repair worth making: trailing commas before } or ].
          try {
            return JSON.parse(candidate.replace(/,(\s*[}\]])/g, '$1'));
          } catch {
            const at = Number(/position (\d+)/.exec((error as Error).message)?.[1] ?? 0);
            const near = candidate.slice(Math.max(0, at - 40), at + 40).replace(/\s+/g, ' ');
            throw new Error(`Model reply JSON did not parse: ${(error as Error).message} (near: ${near})`);
          }
        }
      }
    }
  }
  throw new Error('Model reply JSON object was not closed (output cut off?).');
}

function asString(value: unknown, field: string, problems: string[]): string {
  if (typeof value === 'string') return value.trim();
  problems.push(`${field} is missing or not a string`);
  return '';
}

/** Parse a model reply into a Bundle. Shape problems are thrown together. */
export function parseBundle(raw: unknown): Bundle {
  const value = extractJsonObject(extractModelText(raw));
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Model reply JSON was not an object.');
  }
  const o = value as Record<string, unknown>;
  const problems: string[] = [];
  const pinsRaw = Array.isArray(o.pins) ? o.pins : [];
  if (!Array.isArray(o.pins)) problems.push('pins is missing or not an array');
  const pins = pinsRaw.map((pin, i) => {
    const p = (pin && typeof pin === 'object' ? pin : {}) as Record<string, unknown>;
    return {
      title: asString(p.title, `pins[${i}].title`, problems),
      description: asString(p.description, `pins[${i}].description`, problems),
    };
  });
  const markers = Array.isArray(o.confirm_markers) ? o.confirm_markers : [];
  if (o.confirm_markers !== undefined && !Array.isArray(o.confirm_markers)) {
    problems.push('confirm_markers is not an array');
  }
  const bundle: Bundle = {
    title: asString(o.title, 'title', problems),
    slug: asString(o.slug, 'slug', problems),
    meta_description: asString(o.meta_description, 'meta_description', problems),
    summary: asString(o.summary, 'summary', problems),
    body_html: asString(o.body_html, 'body_html', problems),
    pins,
    instagram_caption: asString(o.instagram_caption, 'instagram_caption', problems),
    newsletter_blurb: asString(o.newsletter_blurb, 'newsletter_blurb', problems),
    confirm_markers: markers.filter((m): m is string => typeof m === 'string' && m.trim() !== '').map((m) => m.trim()),
  };
  if (problems.length) throw new Error(`Model reply had the wrong shape: ${problems.join('; ')}.`);
  return bundle;
}
