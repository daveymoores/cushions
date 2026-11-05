import type {Bundle} from './bundle';
import type {Env} from './env';
import {fetchWithTimeout, TIMEOUT_MS, type FetchLike} from './http';

/** Plain-text email via the Resend REST API. No HTML, so no tracking pixel. */
export async function sendEmail(
  env: Env,
  fetcher: FetchLike,
  message: {subject: string; text: string; idempotencyKey: string},
): Promise<string> {
  if (!env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
  const to = env.REVIEW_TO.split(',').map((s) => s.trim()).filter(Boolean);
  if (!to.length) throw new Error('REVIEW_TO is empty');
  const response = await fetchWithTimeout(
    fetcher,
    'https://api.resend.com/emails',
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        'content-type': 'application/json',
        'idempotency-key': message.idempotencyKey.slice(0, 256),
      },
      body: JSON.stringify({from: env.REVIEW_FROM, to, subject: message.subject, text: message.text}),
    },
    TIMEOUT_MS.resend,
  );
  const body = await response.text();
  if (!response.ok) throw new Error(`Resend returned ${response.status}: ${body.slice(0, 300)}`);
  return (JSON.parse(body) as {id?: string}).id ?? '';
}

function section(title: string, lines: string[]): string {
  return lines.length ? `${title}\n${'-'.repeat(title.length)}\n${lines.join('\n')}\n` : '';
}

function socialLines(bundle: Bundle): string[] {
  return [
    ...bundle.pins.flatMap((pin, i) => [`Pin ${i + 1}`, `Title: ${pin.title}`, `Description: ${pin.description}`, '']),
    'Instagram caption',
    bundle.instagram_caption,
    '',
    'Newsletter blurb',
    bundle.newsletter_blurb,
  ];
}

export function reviewEmail(args: {
  bundle: Bundle;
  topic: string;
  adminUrl: string;
  suggestions: string[];
  model: string;
}): {subject: string; text: string} {
  const {bundle} = args;
  return {
    subject: `Journal draft ready: ${bundle.title}`,
    text: [
      `A new journal draft is waiting in Shopify. It is NOT published.`,
      ``,
      `Open it: ${args.adminUrl}`,
      ``,
      section(
        'Check these before publishing',
        bundle.confirm_markers.length ? bundle.confirm_markers.map((m) => `[ ] ${m}`) : ['Nothing flagged. Still read it through.'],
      ),
      section('Summary', [bundle.summary]),
      section('Details', [`Topic: ${args.topic}`, `Slug: /journal/${bundle.slug}`, `Meta description: ${bundle.meta_description}`]),
      section('Social copy (not saved in Shopify)', socialLines(bundle)),
      section('New topic ideas (not added to the backlog; reply if you want any)', args.suggestions.map((s) => `- ${s}`)),
      `To publish: edit the article in Shopify, resolve each item above, then set it to Visible.`,
      `Written by ${args.model}.`,
    ].join('\n'),
  };
}

export function rejectedEmail(args: {
  bundle: Bundle | null;
  topic: string;
  violations: string[];
  attempts: number;
  suggestions: string[];
}): {
  subject: string;
  text: string;
} {
  return {
    subject: `Journal draft rejected: ${args.topic}`,
    text: [
      `The pipeline wrote a draft for "${args.topic}" ${args.attempts} times and every attempt failed its checks, so nothing was created in Shopify.`,
      ``,
      section('Why it was rejected', args.violations.map((v) => `- ${v}`)),
      args.bundle ? section('The last draft (for reference)', [`Title: ${args.bundle.title}`, `Summary: ${args.bundle.summary}`]) : '',
      section('New topic ideas', args.suggestions.map((s) => `- ${s}`)),
      `The full draft is in the run record (GET /status). This topic has been set aside so next week moves on; to try it again, add it back with POST /topics, then POST /run/draft?force=1.`,
    ].join('\n'),
  };
}

export function failureEmail(args: {runKey: string; step: string; error: string}): {subject: string; text: string} {
  return {
    subject: `Journal pipeline failed at ${args.step}`,
    text: [
      `This week's journal run stopped at the step "${args.step}". Nothing was published.`,
      ``,
      `Error: ${args.error}`,
      `Run: ${args.runKey}`,
      ``,
      `Run again with POST /run/draft?force=1 once the cause is fixed.`,
    ].join('\n'),
  };
}
