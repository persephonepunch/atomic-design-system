# Atomic Design System

Atomic design system for **Webflow + Shopify Web Components** storefronts — a shared,
machine-readable contract for both **human and agent state managers**. One token source
feeds the CSS components and a JS/Vue component track, kept visually identical by sharing the
same tokens.

- **Spec:** [`DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md) — the canonical contract (tokens, fluid design, AEO, and Cart/Consent/Login/Forms/PDP/Collection/Tags/Category/Quick View feature specs with acceptance criteria).
- **Tokens:** `tokens/*.json` → Style Dictionary → `src/generated/tokens.{css,js}`.
- **Components:** vanilla CSS in `src/`, organized by **atomic design** and a layered cascade.

## Business challenge

This is a **Dynamic Reactive Component Build System**, not a static no-code site: **Webflow
is the content-curation and compile layer** (editors curate copy, media, and page structure;
it compiles to markup + variables), while **Shopify Web Components** stream live commerce data
into the same components at runtime. The system is governed by one design-system contract that
**both human and agent state managers** read and write — humans curating in Webflow/Shopify,
and agents (recommendations, agentic shoppers, AI coding agents) reading the same tokens,
hooks, and data.

Without that shared contract the two halves drift apart — content/state in Webflow, commerce
state in Shopify + services — and in practice that produced —

- **Fragmented UI & drift.** Styling was authored ad-hoc across Webflow custom code, worker
  embeds, and a reference project, with hardcoded colors/sizes and duplicated tokens. The
  same button looked different in three places.
- **Brittle, regression-prone changes.** Small edits caused real breakage: mobile heroes
  cutting off titles, duplicated "Pairs well with" sections, cart lines dropping variant
  options, square-corner overrides wiping rounded corners. Every fix risked another.
- **Slow iteration.** No single source of truth meant a color or radius change had to be made
  by hand in many files, and couldn't be safely automated.
- **Poor machine-readability.** The storefront wasn't structured for discovery by search or
  AI answer engines, nor for AI coding agents to modify reliably.

**The fix:** one normalized **token layer** + an **atomic component library** consumed from a
single source by Webflow (content + compile), Shopify Web Components (commerce data), and AI
agents alike — so design is consistent, a change propagates once, the UI is fluid/accessible
by default, and runtime state stays legible to both human and agent state managers.

## AI benefits

This system is built to be consumed by machines as much as humans:

- **AEO (Answer Engine Optimization).** Structured data (JSON-LD) + semantic HTML on every
  page type make products **discoverable and citable by AI answer engines** (ChatGPT,
  Perplexity, Google AI Overviews) and agentic shoppers — not just classic SEO.
- **Agentic commerce ready.** A clean JSON API (`/collection`, `/product`, `/search`,
  `/recs`) plus structured product data lets **AI shopping agents** read catalog,
  recommendations, and complete purchases.
- **AI-assisted development.** Machine-readable contracts — token names, component hooks,
  acceptance criteria in [`DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md) and the companion skills —
  let coding agents (e.g. Claude Code) **build and modify UI reliably and consistently**
  instead of guessing.
- **Personalized recommendations.** First-party signals feed an AI-driven "Pairs well with"
  and search re-ranking, consent-gated, and extensible to GA4 aggregate signals.
- **Design-tool interoperability.** Style Dictionary tokens are a portable source of truth
  that **Figma / Tokens Studio and AI tooling can read and write**, keeping design and code
  in sync.
- **Tag-driven lifecycle automation + AEO.** Products, users, and sessions carry a shared,
  machine-readable **tag** layer — queried with Shopify search syntax and synced with
  **upstream systems (WMS, ERP, fraud, customer service)** — that drives lifecycle automation
  *and* AEO faceting (availability, segments, badges). Idempotent and consent-gated. See
  [`DESIGN-SYSTEM.md` §14.1](./DESIGN-SYSTEM.md).

## Structure

```
tokens/                 color · type · layout · motion  (source of truth, JSON)
style-dictionary.config.mjs
src/
  base/base.css         @layer base — minimal Normalize fallback (defers to Webflow's)
  generated/tokens.css  @layer tokens — built from tokens/ (committed, usable w/o build)
  generated/tokens.js   JS constants (for the future Vue track)
  atoms/                @layer atoms — button, field, …
  molecules/            @layer molecules — product-card, filter, variant-switch, …
  organisms/            @layer organisms — cart, collection, pdp, quick-view, consent, forms
  templates/            @layer templates — collection / pdp / cart layout
  overrides.css         @layer overrides — rounded-corner controls + legacy/host defeats
  index.css             entry: declares layer order + imports everything
```

## Cascade (the rule that replaces specificity hacks)

`@layer base < tokens < atoms < molecules < organisms < templates < overrides`

- Every value resolves from a token-with-fallback: `var(--pim-color-primary, #1a1a1a)`.
- `!important` is allowed **only** in `overrides.css`, and only to defeat a host
  (Webflow / legacy storefront) — never between our own components.

### Rounded corners
Rounding is **token-controlled** via `--pim-radius-default` (defined in
[`tokens/layout.json`](./tokens/layout.json)). When a host force-squares corners,
`src/overrides.css` re-applies that token to components, plus opt-in utilities
`.pim-round-none|-sm|-md|-lg|-xl|-full` and `.pim-round-reapply`.

## Tokens

```bash
npm install          # installs style-dictionary
npm run build:tokens # tokens/*.json -> src/generated/tokens.{css,js}
```
`src/generated/*` is committed so the system works without building; rebuild after
editing `tokens/`. Token names use the `--pim-*` prefix so they match the names the
storefront components and **Webflow Variables** already reference (name your Webflow
Variables `--pim-*`, or add a one-line `:root` bridge).

## Using it

**In Webflow** — load `src/index.css` (or the built bundle) via site Custom Code / a
Cloudflare Worker embed; the components attach to the documented class/ID hooks and
mount points (`#mainpdp`, `#collection-div`, `#filter-wrap`, `#card-column`,
`#pdp-pairs-well`, `#qv-dialog`, …).

**Data** — Shopify **Storefront Web Components** (`cdn.shopify.com/storefront/web-components.js`)
for store/cart/product primitives, plus the PIM worker JSON API
(`/collection`, `/product`, `/search`, `/recs`) for catalog, search, and recommendations.

## Relationship to other repos
- `pim-sync-app` (shop-chat-agent) — the worker + live embeds this system standardizes; skills `pim-design-components`, `pdp-embeds`, `webflow` document the current hooks.
- `hx-stack` — the reference/example 11ty storefront.

## Roadmap (see DESIGN-SYSTEM.md §3.1 + the migration notes)
1. **Phase 0** — normalize tokens (done) + Style Dictionary pipeline (done).
2. **Vanilla** — port atoms→organisms from the live embeds into `src/`.
3. **Optional library** — add Vue + UIkit islands; bridge UIkit's variables to `--pim-*`.
4. **i18n** — Webflow Localization (static) + vue-i18n (dynamic).
