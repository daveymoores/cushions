# The merchant docs live in Linear

Two documents that used to live in this folder are **canonical in Linear**, in the
`Sisu — sisuhomeware.com launch` project. Jessie is already a member of that workspace, so
she reaches them without an invite and without a code repository.

| Document | Linear |
|---|---|
| **Updating your site** — plain-English guide for Jessie | [linear.app/far-harbour/document/updating-your-site-8298640f3dc9](https://linear.app/far-harbour/document/updating-your-site-8298640f3dc9) |
| **Storefront operating manual** — reference for Jessie's AI assistant | [linear.app/far-harbour/document/storefront-operating-manual-5b72fd96e5ab](https://linear.app/far-harbour/document/storefront-operating-manual-5b72fd96e5ab) |

**Do not recreate those markdown files.** Two copies drift, and the Linear one is the copy
people actually read. If you need the content, fetch it from Linear.

`docs/OWNERS-GUIDE.md` deliberately **stays in this repo** — it is the developer operations
doc (deploys, env vars, DNS, CSP) and needs to version alongside the code it describes.

## Document IDs

| Document | ID |
|---|---|
| Updating your site | `85333298-4df6-4e16-98af-d5f0f74b94dd` |
| Storefront operating manual | `f154dccd-959d-4e71-aecd-c2fe1a12994e` |
| Project | `b0bd1134-24b1-47b7-a806-8b8d128cd9ae` |

They lived in Notion until 2026-08-27 and were moved to Linear the same day. If you find a
Notion page for either, it is a tombstone — do not edit it, and do not treat it as a source.

## You must update these as the code changes

These docs describe behaviour that lives in code. When the code moves and the docs don't,
the docs quietly start lying to a non-technical person. **Treat a doc update as part of the
change, not as follow-up work.**

Update Linear in the same piece of work if you change any of:

- **A `homepage` or `material` metaobject field** — added, removed, renamed, or retyped.
  The operating manual lists all 16 `homepage` keys with the exact fallback string for each.
- **A fallback string.** Both docs quote fallbacks verbatim so Jessie can recognise "my edit
  reverted" as a blanked field. A changed fallback makes that diagnosis wrong.
- **A `custom.*` product metafield** — the five spec fields. Since FAR-94 (2026-09-09) a
  blank field drops its row rather than showing a fallback; both docs say so.
- **A Settings → Policies handle or the Shopify policies route** — `/policies/<handle>`
  renders `privacy-policy`, `refund-policy`, `shipping-policy`, `terms-of-service`,
  `terms-of-sale`, `subscription-policy`, `contact-information` from admin; a blank policy
  404s. Both docs list which are live.
- **A hardcoded handle** — blog `journal`, collection `cushions`, pages `atelier` /
  `shipping` / `returns` / `contact` / `faq` / `fabrics`, menus `main-menu` / `footer` /
  `social`, the seven policy handles above, article `how-a-sisu-cushion-is-made`, and the
  Online Store theme snippet `headless-redirect` (the checkout-host redirect). Both docs have
  a do-not-rename table built on these.
- **Header nav labels, footer links, homepage section order, the values strip, section
  eyebrows or button labels** — the "ask David" / "escalate" tables enumerate these.
- **Cache strategy** (`app/root.tsx`, or adding a `cache` option to any loader, including the
  Behold Instagram fetch in `app/lib/instagram.ts`). Both docs tell Jessie "reload twice" and
  explicitly forbid saying "it takes a day".
- **Shipping or returns markup** (`app/lib/policies.ts`) — the docs tell Jessie to tell David
  the same day she changes a rate, a shipping discount (e.g. the NL promotion ending
  2026-12-31) or the returns terms.
- **The Online Store theme** — the redirect snippet, or which theme is published. Both docs
  warn that publishing any other theme drops the checkout-host redirect.
- **Any image slot's aspect ratio or container size** — both docs carry a shapes table.
- **What a missing image looks like.** Products and collections without a photograph render
  an empty block at the slot's ratio (as of 2026-08-27; previously a dead placeholder URL).
- **Fixing something listed as broken** — newsletter sign-up (the form was removed in
  `4299474`; wiring tracked in FAR-109), the `/account` stub, `No. 0X`, missing sale
  strike-through, the Instagram section waiting on `BEHOLD_FEED_ID`. When one is fixed, remove it from
  the "not finished yet" / "known-broken" sections. Leaving a fixed item listed is as bad as
  omitting a broken one.

## How to update

1. **Read the current document** with `mcp__claude_ai_Linear__get_document` (ID above), so
   you edit rather than overwrite. Someone may have edited it in Linear directly — that is
   allowed and expected.
2. **Edit** with `mcp__claude_ai_Linear__save_document`, passing `patch` for a targeted change
   rather than resending the whole body.
3. **Read it back** and check the change rendered, particularly any table you touched.

### Things to know about the format

Linear documents are **standard Markdown** — ordinary pipe tables, no XML. Much simpler than
the Notion flavour these were originally written in.

Linear re-serializes on save, which is benign but will surprise you on a diff: `-` bullets
become `*`, `| --- |` becomes `| -- |`, and bare URLs get wrapped in angle brackets. Linear's
editor schema also cannot nest a code span inside a bold mark, so `**\`homepage\` field**`
re-splits into `**` … `` `homepage` `` … `**`. It renders identically. Do not try to "fix"
either — re-sending produces the same result.

## Who can see them

Both live in the `Sisu — sisuhomeware.com launch` project in the **Far Harbour** Linear
workspace. Jessie is already a member there as **jessiebrewin.uk@gmail.com** — no invite step,
unlike the Notion arrangement this replaced.

Note her two addresses differ by tool: **Linear is `.uk`**, while **Shopify and Notion are
`jessiebrewin.nl@gmail.com`**.

## Provenance

Both documents were verified on 2026-08-27 against the live store (via the Storefront API
using `PUBLIC_STOREFRONT_API_TOKEN` from `.env`, API version 2026-04) and against the
running code. Reads of metaobject field keys and types, metafield values, and handles need
no Admin token and no MCP — see `docs/OWNERS-GUIDE.md` for the curl recipe.
