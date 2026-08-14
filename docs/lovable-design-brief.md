# HOC Elite Wheels — Design Brief for Lovable

Paste this whole document into Lovable **before** any feature request, in a fresh
project chat. It carries no backend or architecture instructions — this Lovable
project is a separate, lightweight frontend, not the production platform (that's
being built separately as a Next.js/Supabase monorepo). Its only job here is to
carry the brand faithfully.

---

## 0. What this is

**HOC Elite Wheels** is a platform where a customer acquires and operates their
own branded electric-vehicle ride-hailing service without driving. They browse
vehicles like products, configure a fleet, apply, get approved, and then run
their own live ride-dispatch business from a dashboard. The product being sold
is a turnkey, ownable, live ride business — not a car.

Do not invent or assert new facts about HOC (pricing, entity structure, market
specifics, dates, partners). If a prompt needs a fact that isn't in this brief,
stop and ask rather than filling it in.

## 1. Brand mark — the one ornament

The HOC logo is a gold, radially-symmetric emblem (interlocking petals around a
hollow centre, marbled gold-leaf finish). Use it **exactly as supplied, unedited**
— header lockup, loader, favicon, and a large low-opacity watermark behind hero
or section breaks. It is the *only* gold thing on screen. Never derive a gold
UI theme, gold buttons, gold borders, or gold text from it.

Asset to upload into Lovable: `apps/web/public/brand/hoc-logo.png`

## 2. Colour — near-monochrome, one signal colour

This is a dual-theme system (light canvas for public/commerce surfaces, dark
"room" for hero moments and anything showing live activity). Hierarchy comes
from **opacity tiers on one ink colour**, not from additional hues.

```css
/* Light room */
--canvas:            #FFFFFF
--surface:            hsl(240 10% 95%)
--surface-raised:     #FFFFFF
--frosted:            hsl(240 5% 70% / 0.148)
--primary:            hsl(225 66.7% 1.2%)      /* near-black ink */
--contrast-higher:    hsl(225 66.7% 1.2% / 0.92)
--contrast-high:      hsl(225 66.7% 1.2% / 0.72)
--contrast-medium:    hsl(225 66.7% 1.2% / 0.54)
--contrast-low:       hsl(225 66.7% 1.2% / 0.14)   /* hairlines only, not text */

/* Dark room */
--canvas:             hsl(225 66.7% 1.2%)      /* ≈ #04060B */
--surface:            hsl(240 2% 10%)
--surface-raised:     hsl(240 2% 13%)
--frosted:            hsl(240 2% 43% / 0.228)
--primary:            hsl(225 100% 99%)        /* near-white ink */
--contrast-higher:    hsl(225 100% 99% / 0.92)
--contrast-high:      hsl(225 100% 99% / 0.72)
--contrast-medium:    hsl(225 100% 99% / 0.54)
--contrast-low:       hsl(225 100% 99% / 0.14)

/* Fixed, both rooms */
--signal:  #D5001C   /* Guards Red — the ONLY signal colour */
--focus:   #1A44EA   /* focus-visible outline only */
```

**Discipline rule:** red marks what's *live* — an active trip, the single
primary hero CTA, an active/selected state — and nothing else. It is a signal,
never a theme, never decoration. Standard semantic colours (success/warning/
error/info) are fine for form validation only, kept out of the brand palette.

## 3. Typography — one engineered grotesque, one accent exception

Shipping typeface is **Inter**, weights **400 / 600 / 700** — used for
everything: headings, body, numbers, buttons. No serif, no separate mono, no
uppercase tracking-heavy display type.

**One deliberate exception:** the wordmark "HOC ELITE WHEELS" centred in the
header uses **Mr Dafoe** (weight 400, Google Fonts), slanted script — nowhere
else. Every other piece of type on the page is Inter.

```
Display (hero)    clamp(3.4rem, 7vw, 7.5rem) · 600 · line-height 0.88 · tracking -0.06em
Section headline  clamp(3rem, 7vw, 7rem)     · 600 · line-height 0.9  · tracking -0.055em
Eyebrow/label     0.75rem · 600 · uppercase · tracking 0.2em (used sparingly, as a small tag above headlines — not as a general style)
Body              1.125rem · 400 · line-height 2 (8/4 spacing scale)
Numbers/figures   same face as body/display — no tabular mono substitute
```

## 4. Layout & spatial grammar

- Radii: `0` on containers/sections, `4px` fields, `8px` cards, `999px` (pill) on buttons/chips.
- Full-bleed imagery, or a vehicle isolated with `object-contain` (never cropped/`object-cover`) against a flat plate.
- Generous whitespace; a `page-shell` max-width with fluid side gutters (`clamp(1.5rem, 5.5vw, 5.5rem)`).
- A page/section declares its **room** (`light` or `dark`) — this is a layout property, not a user-facing theme toggle.
- No drop shadows on cards/panels; only a soft contact shadow directly under isolated product imagery.

## 5. Motion

```
enter        500ms   ease [.16,1,.3,1]   fade + rise on section reveal
overlay      380ms   same ease           menu / panel open
stagger      40ms                        successive rows/items
hover        160ms   ease-out            opacity/lightness shift only — never scale
count-up     900ms                       numerals count up once, on first viewport entry
total tween  240ms                       recalculated totals/figures, on change only
```

Respect `prefers-reduced-motion`: fades only, counters render final value immediately.
Hover states never scale an element — opacity or lightness shift only.

## 6. The signature motif — "The Signal Line"

A single hairline (`--contrast-low`) threads vertically between sections on
public pages. It stays monochrome by default. Wherever the product shows
something *live* (an active trip, a live status), the line turns Guards Red and
pulses. Red on this line always means "live," never decoration.

## 7. Voice

Plain, confident, engineered — not salesy, not apologetic. Name things by what
the owner controls ("Your fleet," "Dispatch," "Payouts"). Buttons state the
outcome, not the mechanism: **"Configure a fleet," "Explore vehicles," "See how
it works"** — these are real, already-shipped examples, reuse the pattern.
Where data isn't real yet, say so plainly in the UI itself (e.g. "Vehicle
specifications and availability pending HOC confirmation") rather than hiding
the gap or inventing a number.

## 8. Hard guardrails

- Never invent business facts, prices, dates, or figures. Use explicit
  "pending confirmation" language or a placeholder clearly marked as such.
- Vehicle models are neutral placeholders (e.g. "Model 01") until HOC supplies
  real names — do not invent model names.
- No Stripe anywhere, in code or copy — Paystack is the production payment
  provider (not relevant to a Lovable-only frontend, but never reference Stripe).
- Don't simulate authentication, KYC, application submission, or payment as if
  they succeeded — stop short of those actions in any prototype flow, the same
  way the production storefront does.
- No second accent colour, no gradients as decoration, no rounded/bordered
  product photography.

## 9. Assets already available (upload into this Lovable project)

From this local project folder:
- `apps/web/public/brand/hoc-logo.png` — the gold emblem, use as-is
- `apps/web/public/vehicles/hero-saloon-side-v1.png` — unbranded hero vehicle cutout
- `apps/web/public/vehicles/cutouts/model-0{1..4}-v2.png` — catalogue vehicle cutouts
- `apps/web/public/vehicles/lineup-0{1..3}.jpg` — lineup/editorial imagery
- `Hero Video.mp4` (project root) — hero video asset

---

### Using this brief

This document is the standing "system" context — paste it first, every time,
in a fresh Lovable chat before any feature prompt. When you know which specific
page or flow you want Lovable to build (a landing page, a waitlist form, a
visual mock of the owner dashboard, etc.), tell me and I'll draft a scoped
feature prompt to paste after this one — same pattern as the phased prompts in
the original build pack, just aimed at Lovable's own stack instead of the
Next.js monorepo.
