# The merchant docs live in Notion

Two documents that used to live in this folder are now **canonical in Notion**. They were
moved on 2026-08-27 so Jessie can reach them without a code repository.

| Document | Was | Now |
|---|---|---|
| Updating your site — plain-English guide for Jessie | `docs/SISU-UPDATING-YOUR-SITE.md` | Notion → Sisu → **Updating your site** |
| Storefront operating manual — reference for Jessie's AI assistant | `docs/SISU-AGENT-GUIDE.md` | Notion → Sisu → **Storefront operating manual** |

**Do not recreate those markdown files.** Two copies drift, and the Notion one is the copy
people actually read. If you need the content, fetch it from Notion.

`docs/OWNERS-GUIDE.md` deliberately **stays in this repo** — it is the developer operations
doc (deploys, env vars, DNS, CSP) and needs to version alongside the code it describes.

## Page IDs

| Page | ID |
|---|---|
| Sisu (parent) | `3c952aa6-21cc-81c3-bea9-ec9ff4d7bcec` — share **this one**; permissions inherit to both children |
| Updating your site | `3c952aa6-21cc-81a1-b58b-c9bbce084896` |
| Storefront operating manual | `3c952aa6-21cc-8136-85ff-cefba96f9bf8` |

## You must update these as the code changes

These docs describe behaviour that lives in code. When the code moves and the docs don't,
the docs quietly start lying to a non-technical person. **Treat a doc update as part of the
change, not as follow-up work.**

Update Notion in the same piece of work if you change any of:

- **A `homepage` or `material` metaobject field** — added, removed, renamed, or retyped.
  The agent guide lists all 16 `homepage` keys with the exact fallback string for each.
- **A fallback string.** Both docs quote fallbacks verbatim so Jessie can recognise "my edit
  reverted" as a blanked field. A changed fallback makes that diagnosis wrong.
- **A `custom.*` product metafield** — the five spec fields and their fallbacks. Note two of
  them (`insert`, `care`) assert facts, which is called out as a hazard.
- **A hardcoded handle** — blog `journal`, collection `cushions`, pages `atelier` /
  `shipping` / `returns` / `contact`, article `how-a-sisu-cushion-is-made`. Both docs have a
  do-not-rename table built on these.
- **Header nav labels, footer links, homepage section order, the values strip, section
  eyebrows or button labels** — the "ask David" / "escalate" tables enumerate these.
- **Cache strategy** (`app/root.tsx`, or adding a `cache` option to any loader). Both docs
  tell Jessie "reload twice" and explicitly forbid saying "it takes a day".
- **Any image slot's aspect ratio or container size** — both docs carry a shapes table.
- **Fixing something listed as broken** — the newsletter form discarding submissions, the
  `/account` stub, `No. 0X`, missing sale strike-through, `FALLBACK_IMAGE`. When one is
  fixed, remove it from the "not finished yet" / "known-broken" sections. Leaving a fixed
  item listed is as bad as omitting a broken one.

## How to update

1. **Read the format spec first.** `notion-fetch` with id `notion://docs/enhanced-markdown-spec`.
   Do not guess the syntax.
2. **Read the current page** with `notion-fetch` on its ID above, so you edit rather than
   overwrite. Someone may have edited it in Notion directly — that is allowed and expected.
3. **Edit** with `notion-update-page`.
4. **Fetch it back and check the change rendered**, particularly any table you touched.

### The one thing that will catch you out

**Markdown pipe tables do not work in Notion.** They must be `<table>` / `<tr>` / `<td>` XML
with `header-row="true"`. Both pages are table-heavy. Cells take rich text only — use
`**bold**` and backtick-code inside them, never HTML tags, never a nested list.

Internal anchor links (`[section 12](#12-things-not-to-rename)`) also do not resolve in
Notion. Reference sections by bold name instead.

## Who can see them

The pages are in David's Notion workspace. Jessie's Notion account is
**jessiebrewin.nl@gmail.com** (she also has a `.uk` address — the `.nl` one is her Notion
login and the one the Shopify store transfer went to).

If she reports she cannot open a page, it is a Notion sharing problem, not a content
problem — the parent **Sisu** page has to be shared with her and permission inherits down.

## Provenance

Both documents were verified on 2026-08-27 against the live store (via the Storefront API
using `PUBLIC_STOREFRONT_API_TOKEN` from `.env`, API version 2026-04) and against the
running code. Reads of metaobject field keys and types, metafield values, and handles need
no Admin token and no MCP — see `docs/OWNERS-GUIDE.md` for the curl recipe.
