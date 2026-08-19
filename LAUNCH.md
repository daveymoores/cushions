# sisuhomeware.com — go-live checklist

Working list for getting the Sisu storefront live on Shopify Oxygen.
Keep statuses current: `[ ]` todo · `[~]` in progress · `[x]` done · `[>]` deferred.

## Code (repo)

- [x] Remove Cloudflare Workers deployment (wrangler.jsonc, cache shim, deploy scripts) — verified: typecheck, build, lint clean
- [x] Add PostHog (posthog-js 1.418.1, EU region, env-var driven, CSP verified live in browser) — no-ops when key is empty
- [x] Fill `PUBLIC_POSTHOG_KEY` in `.env` (project "SISU", id 252430, eu.posthog.com)
- [ ] Decide + flip `USE_MOCK_DATA` in route loaders (pending: is Shopify admin content populated?)
- [ ] Push to `main` (triggers Oxygen deploy once GitHub is connected)

## Shopify / Oxygen (David, in Shopify admin)

- [!] **Store swap required.** The SISU store (sisu-yswysm5o) is a Dev-Dashboard development store in a developer org: it cannot take a real plan, cannot create Hydrogen storefronts, and can never serve public traffic. Its content is disposable dummy data (confirmed 2026-08-19); only the `homepage` + `material` metaobject definitions need recreating on the new store.
- [ ] Create a fresh merchant store at shopify.com (owner email decision: David or girlfriend), name SISU, pick the Basic plan
- [ ] Update repo `.env` + Headless/Hydrogen tokens to the new store domain
- [ ] Recreate metaobject definitions (`homepage`, `material`) and product metafields (fiber, origin, loom, care, repair) per HANDOFF.md
- [ ] Delete the old dev store after cutover (optional)
- [ ] Add the **Hydrogen** sales channel
- [ ] Connect GitHub repo `daveymoores/cushions`, branch `main`
- [ ] Set Oxygen environment variables: `SESSION_SECRET`, `PUBLIC_POSTHOG_KEY`, `PUBLIC_POSTHOG_HOST` (store domain/token vars are injected by Oxygen automatically)
- [ ] Confirm first deployment serves on the oxygen preview URL
- [ ] Add `sisuhomeware.com` as a domain in Shopify admin → Settings → Domains
- [x] Paid Shopify plan — upgraded to Basic (2026-08-19); was blocking Hydrogen storefront creation and public environments. Note: the Online Store channel + its themes are unused; the Hydrogen storefront replaces them.

## PostHog

- [x] Create project in the PostHog UI — created as "SISU" (id 252430)
- [x] Pull API key into `.env` — still needed in Oxygen env vars once the Hydrogen channel is connected
- [ ] Verify events arrive after launch

## Domain / DNS (Cloudflare)

- [x] Move DNS to Cloudflare: zone active on cullen/mia.ns.cloudflare.com (2026-08-19)
- [~] Set Cloudflare SSL/TLS mode to **Full (strict)** — zone is active, do now
- [ ] After Oxygen is live: apex `A` → `23.227.38.65`, `www` CNAME → `shops.myshopify.com`, both **DNS only (grey cloud)**; delete the `*` wildcard and old Hostnet A/AAAA records
- [ ] SSL certs: automatic on both sides (Cloudflare Universal SSL + Shopify-issued cert) — verify https works after cutover

## Google Search Console

- [ ] Add domain property for `sisuhomeware.com`, verify via DNS TXT record in Cloudflare
- [ ] Submit `https://sisuhomeware.com/sitemap.xml`

## Deferred (after launch)

- [>] **Email for sisuhomeware.com** — no mailbox exists today; nothing blocks launch. When wanted: Cloudflare Email Routing for free forwarding (adds its own MX/SPF automatically), or a real host (e.g. Google Workspace) — then add MX, SPF, DKIM, DMARC records in Cloudflare.
- [>] Delete the old Cloudflare Worker (`sisu`) after Oxygen cutover is confirmed
