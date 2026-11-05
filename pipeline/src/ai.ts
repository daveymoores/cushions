import type {Env} from './env';

export type ChatMessage = {role: 'system' | 'user' | 'assistant'; content: string};

export type ModelReply = {model: string; raw: unknown; attempts: Array<{model: string; error?: string}>};

/** gpt-oss spends part of the budget on reasoning, so leave plenty of room. */
const MAX_TOKENS = 12_000;

/**
 * Primary model, then the fallback. Throws, naming both failures, if neither
 * answers: a silent empty bundle would be worse than a failed run.
 */
export async function runModel(env: Env, messages: ChatMessage[]): Promise<ModelReply> {
  const attempts: ModelReply['attempts'] = [];
  for (const model of [env.PRIMARY_MODEL, env.FALLBACK_MODEL].filter(Boolean)) {
    try {
      const raw: unknown = await env.AI.run(model as Parameters<Ai['run']>[0], {
        messages,
        max_tokens: MAX_TOKENS,
        temperature: 0.6,
        // Both catalog schemas list JSON mode. The first real dry run (2026-11-05,
        // without it) returned a reply that did not parse.
        response_format: {type: 'json_object'},
      } as never);
      attempts.push({model});
      return {model, raw, attempts};
    } catch (error) {
      attempts.push({model, error: error instanceof Error ? error.message : String(error)});
    }
  }
  throw new Error(
    `No model answered: ${attempts.map((a) => `${a.model}: ${a.error ?? 'unknown error'}`).join(' | ')}`,
  );
}
