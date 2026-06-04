# HX Design System

Atomic design system for **Webflow + Shopify Web Components** storefronts. One
token source feeds the CSS components (Webflow embeds today) and, later, a JS/Vue
component track — kept visually identical by sharing the same tokens.

- **Spec:** [`DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md) — the canonical contract (tokens, fluid design, AEO, and Cart/Consent/Login/Forms/PDP/Collection/Tags/Category/Quick View feature specs with acceptance criteria).
- **Tokens:** `tokens/*.json` → Style Dictionary → `src/generated/tokens.{css,js}`.
- **Components:** vanilla CSS in `src/`, organized by **atomic design** and a layered cascade.

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
Legacy storefronts sometimes force square corners globally
(`#pim-body-wrap * { border-radius: 0 !important }`). `src/overrides.css` re-applies
the token radius to components and provides opt-in utilities:
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
