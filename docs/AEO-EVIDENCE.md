# AEO/GEO evidence notes (researched 2026-08-19)

Companion to `SEO-AI-AUDIT.md` — the primary-source evidence behind the recommendations.
Condensed; tags: [vendor] = official docs/statements, [study] = named study with sample size.

## Verdicts

- **llms.txt: hype.** Google explicitly ignores it [vendor: Google AI-optimization guide, 2026-07-10]; no vendor confirms reading it; 300K-domain SE Ranking study found zero correlation with AI citations; a 12K-request log study found zero AI-bot fetches of it. Shopify redirects `/llms.txt` → auto-generated `/agents.md` anyway. Spend ~nothing here.
- **Structured data: do it for Google merchant listings and Bing, not "for the LLMs."** Ahrefs diff-in-diff (1,885 treated vs 4,000 control pages): no causal AI-citation lift. Google: "no special schema.org markup you need to add" for AI features.
- **FAQPage/HowTo markup: dead** (Google removed FAQ rich results entirely, June 2026; HowTo dead since 2023). Visible Q&A HTML still good.
- **SearchAction/sitelinks searchbox: deprecated** (removed Nov 2024). Don't ship.
- **LocalBusiness: ineligible** for online-only stores. Use `OnlineStore` (Organization subtype) with address.
- **SSR: mandatory and already satisfied** — GPTBot/ClaudeBot/PerplexityBot do not execute JavaScript [Vercel×MERJ, 500M+ fetches]. Keep JSON-LD/meta early in the document; Googlebot caps HTML fetches at 2MB.
- **Sitemap lastmod: used by Google if accurate; changefreq/priority ignored.** GPTBot/ClaudeBot began fetching sitemaps in March 2026.

## What actually moves AI citations (evidence-ranked)

1. **Google Merchant Center free listings** — AI Mode/Gemini/Business Agent ground shopping answers in Merchant Center. Free, UK-eligible, handmade goods use `identifier_exists: no` [vendor].
2. **Off-site brand mentions** — 0.664 Spearman with AI Overview visibility vs 0.218 for backlinks [Ahrefs, 75K brands].
3. **Review-platform presence** — no Trustpilot profile ≈ 1% citation rate; even 1–13 reviews → 53.5% [Seer×Trustpilot, 800K responses; sponsor caveat].
4. **Reddit/UGC presence** — Reddit is the most-cited domain across engines [Semrush, 126M prompts]. Genuine participation only; astroturfing is detected.
5. **Ordinary organic ranking** — AI answers ride core Search/Bing retrieval.

## Ecommerce-specific actions for this store

- **Enable "Agentic storefronts" in Shopify admin** — Shopify auto-serves `/.well-known/ucp` + UCP endpoints (cannot be self-hosted on headless). UCP is the Shopify+Google protocol wired into Google AI Mode and Copilot Checkout.
- **Enable the ChatGPT sales channel in Shopify admin** ("takes minutes, no code") — that's the search-visibility path into ChatGPT shopping. Don't chase Instant Checkout (US-only, approval-gated).
- **MCP endpoint moved**: `/api/mcp` → `/api/ucp/mcp` (April 2026; old path retired June 2026). Keep Hydrogen current (repo is on 2026.4.2; ≥2026.4.5 recommended) and verify post-cutover which path answers before advertising it in agents.md.
- **Measure with Search Console's "Generative AI performance" report** (June 2026, UK rollout first) and Bing Webmaster Tools' AI Performance report; enable IndexNow via Bing (feeds ChatGPT search retrieval).
- **Budget order for a small brand**: (1) Merchant Center feed, (2) live review profile, (3) PR into UK homeware gift guides, (4) authentic community presence, (5) schema fixes, (6) nothing on llms.txt.

Full source list in the session audit (`SEO-AI-AUDIT.md` sources section).
