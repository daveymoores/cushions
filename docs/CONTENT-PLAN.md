# SISU content plan — from `~/Repositories/sisu-content` (2026-08-19)

Source material: `SISU_Brand_Brief.md.docx` (brand, tone, founder story), `PRODUCT DESCRIPTIONS - NEW.docx`
(3 finished descriptions), `PHOTOS-…zip` (40 images: product front/back, lifestyle, fabric swatches).
Rule of engagement: **keep the layout, replace all placeholder content.**

## 1. Tone of voice (non-negotiable, from the brief)

Understated, colour-led, measured. No poetry, no hype, no manufactured urgency. Product copy format:
evocative grounded opening → deadstock provenance → practical details → factual limited-availability note.

## 2. Catalogue structure

Four named designs, colourways as Shopify **variants** (matches the `NAME - COLOUR` naming in the assets):

| Product | Variants | Size | Description | Photos (front/back) | Swatch | Lifestyle |
|---|---|---|---|---|---|---|
| **Renee** | Cream, Camel | 60×40cm | ✅ both (⚠️ Camel copy is a duplicate of Cream — "reverse finished in soft cream" is likely wrong for Camel; needs correcting) | ✅ (landscape 1195×896) | ✅ ×2 | ✅ sofa + close-up ×2 |
| **Leonie** | Teal, Navy, Orange | 50×50cm | ✅ Teal only — **Navy + Orange need adapting** (same fabric family, different colour story) | ✅ ×3 (portrait 896×1195) | ✅ ×3 | ✅ sofa/armchair/close-ups |
| **Parker** | — | TBC (photos suggest 50×50) | ❌ **write from scratch** | ✅ | ✅ | ✅ sofa + close-up |
| **Ada** | — | TBC (photos suggest 50×50) | ❌ **write from scratch** | ✅ | ✅ | ✅ sofa ×2 + close-up |

Copy to draft (in the established format, for Jessie's sign-off): Parker, Ada, Leonie-Navy, Leonie-Orange,
plus the Renee-Camel back-fabric correction. Construction facts available for all: duck-feather inserts
(55cm insert in 50cm cover), concealed Opti zips, 1.5cm seams, cotton fringing, spot-clean, sewn in
small batches in Amsterdam, deadstock from EU suppliers (Wasted Fabrics, EVA re-source, Fabric Sight).

## 3. Page mapping (existing layout → SISU content)

| Route / section | Today (placeholder) | Becomes | Source |
|---|---|---|---|
| Homepage `announcement` | "made slowly…" marquee | e.g. "Made from deadstock fabric · Sewn in small batches in Amsterdam · Once it's gone, it's gone" (one line each, factual) | brief §1–3 |
| Homepage hero | forest image + "quiet rooms" | lifestyle shot (needs wide crop — §5) + grounded heading | photos |
| Homepage `intro` | atelier intro | 2–3 sentences: deadstock cushions, second-life fabric, small-batch Amsterdam | brief §1 |
| Homepage `mending_*` section | repair/mending story | **repurpose → the deadstock/sustainability story** (finite fabric runs, EU sourcing, why it matters) | brief §4 |
| Homepage `material_*` section | woven materials | the fabrics: jacquards rescued from designer surplus, tracked per cushion | brief §3 |
| Homepage `commission_heading` | commissions | keep or repurpose to "made to order / small batches" (ask Jessie if commissions are actually offered) | open Q |
| `/materials` | linen/velvet/wool entries | **"Fabrics"** — one `material` metaobject entry per fabric/swatch (Renee jacquard, Leonie botanical jacquard, Parker, Ada) with the swatch photos | swatches |
| `/atelier` | north-London atelier page | **About** — Jessie's story: B2B fashion ops background, Amsterdam, why deadstock; SISU name (⚠️ confirm the Finnish "sisu" etymology is wanted publicly) | brief §5 |
| `/journal` | placeholder posts | optional at launch; seed candidates: "What is deadstock fabric?", "How a SISU cushion is made" | brief |
| `/pages/shipping` (Delivery) | 404 today | needs **facts from Jessie** — ships from Amsterdam? carriers, NL/EU/UK rates & times, returns window | brief §7 gap |
| Contact / Press / policies | footer links → journal/404 | create real pages: contact (email), shipping, returns, privacy, terms — also required for Merchant Center + schema (see SEO audit P1-7) | open Q |
| Product "object record" metafields | fiber / origin / loom / care / repair | **relabel to match the spec format**: Front fabric / Back fabric / Trim / Insert / Care (+ keep provenance line in description). Small code change (labels + metafield keys in `queries.ts` / product route) + matching admin definitions | descriptions doc |

Also: `FEATURED_HANDLE` in `app/routes/_index.tsx` → point at the real launch collection.
Collections suggestion: keep it simple at launch — one "All cushions" collection (drives nav), optionally "50×50" / "60×40".

## 4. Copy to be written (draft → Jessie approves)

1. Parker + Ada product descriptions (need from Jessie or photo inspection: front fabric colour/pattern
   names, back fabric, trim colour, size confirmation).
2. Leonie Navy + Orange adaptations (colour story per variant).
3. Renee Camel correction (back fabric).
4. Homepage metaobject: all 13 fields in SISU voice.
5. About page (atelier route).
6. 4–7 `material` metaobject entries (one per fabric, using swatch imagery).
7. Delivery/returns/contact/privacy/terms pages — **blocked on facts** (§6).
8. SEO metadata: retitle site defaults around "deadstock fabric cushions" (currently themed to weaving).

## 5. Imagery work (crops + duplicates)

What exists vs what the layout needs:

| Slot | Layout needs | Have | Action |
|---|---|---|---|
| Homepage hero | full-bleed wide, ≥2400px wide (16:9–21:9) | portrait/square lifestyle shots ≤1326px wide | **cannot be cropped from portrait sources** — extend/outpaint 1–2 sofa scenes to landscape (Photoroom/Flair/Gemini workflow from the brief) or generate a new wide scene with a real cushion composited; then export 2560×1440 + a 1200×1200 og-image crop |
| Collection/product cards | portrait 3:4-ish | product fronts are exactly 896×1195 (3:4) ✅ | use as-is; Renee's landscape shots (1195×896) need a 3:4 crop or padded canvas — pick per-image |
| Product page gallery | 2–4 images per product | front + back + lifestyle close-up + swatch | order: front, lifestyle close-up, back, swatch |
| Materials page | ~square imagery | swatches ~1250×1250 ✅ | use as-is |
| OG/social default image | 1200×630 | none | crop from best lifestyle close-up |
| Journal covers | landscape-ish | lifestyle spares (ADA-SOFA-SQUARE etc.) | crop when posts exist |

Resolution note: everything is ≤1326px wide — fine for cards/galleries, **too small for full-bleed hero
on large screens**. The hero needs a purpose-made wide asset (outpaint or reshoot), not a crop.

Naming/hygiene: fix "CAMAL" → "CAMEL" filenames on upload; ignore `OLD/` and `TEMPLATES/` dirs.

## 6. Open questions for Jessie (blockers marked ⛔)

- ⛔ Prices per design/size (nothing recorded anywhere)
- ⛔ Shipping facts: origin (Amsterdam?), destinations (NL/EU/UK?), rates, times, returns window/policy
- ⛔ Contact email for the site (also feeds Organization schema)
- Parker + Ada: fabric/colour names, sizes, front/back/trim compositions (or approve drafts written from the photos)
- Renee Camel: correct back-fabric wording
- Use the Finnish "sisu" meaning publicly on the About page?
- Are commissions actually offered (homepage section + current site copy says so)?
- Company/VAT details if wanted in schema (legalName, vatID — optional but good for AI attribution)

## 7. Execution order

1. **Now (no blockers):** draft all missing product copy + homepage/about/fabrics copy for approval;
   produce card/gallery crops; upload products to Shopify as drafts (photos + metafields), create
   collection, homepage + material metaobject entries; metafield relabel code change.
2. **After Jessie's facts:** prices, delivery/returns/contact pages, publish products.
3. **Imagery second pass:** hero outpainting/wide banner, og-image.
4. **Then:** flip domain target = launch; GSC sitemap submit, Merchant Center (needs policy pages).
