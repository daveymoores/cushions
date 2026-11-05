/** Bindings, vars and secrets. Vars live in wrangler.jsonc; secrets are set with `wrangler secret put`. */
export interface Env {
  AI: Ai;
  SISU_PIPELINE: KVNamespace;

  SHOP_DOMAIN: string;
  SHOP_ADMIN_HANDLE: string;
  ADMIN_API_VERSION: string;
  STOREFRONT_API_VERSION: string;
  PUBLIC_STOREFRONT_API_TOKEN: string;
  SITE_URL: string;
  BLOG_HANDLE: string;
  AUTHOR_NAME: string;
  REVIEW_TO: string;
  REVIEW_FROM: string;
  INDEXNOW_KEY: string;
  PRIMARY_MODEL: string;
  FALLBACK_MODEL: string;
  DRY_RUN?: string;

  SHOPIFY_ADMIN_TOKEN?: string;
  RESEND_API_KEY?: string;
  PIPELINE_SECRET?: string;
}

/** Every secret value, so error messages can be scrubbed before they are stored or shown. */
export function secretValues(env: Env): string[] {
  return [env.SHOPIFY_ADMIN_TOKEN, env.RESEND_API_KEY, env.PIPELINE_SECRET].filter(
    (value): value is string => typeof value === 'string' && value.length >= 8,
  );
}

export function redact(text: string, env: Env): string {
  let out = text;
  for (const secret of secretValues(env)) out = out.split(secret).join('[redacted]');
  return out;
}
