# Design System — Shopify Web Components Storefront (Global Spec)

Status: **MVP spec** · Scope: storefront UI delivered to Webflow via shared Cloudflare
Worker embeds, built on **Shopify Storefront Web Components** + a worker JSON API.
Companion: the `pim-design-components` skill (component hooks) and the live embeds in
`webflow-embeds/*.html`.

---

## 1. Purpose & principles

A single, token-driven design system for every storefront surface. One token layer feeds
both render tracks:

- **Declarative data** via **Shopify Storefront Web Components** (`cdn.shopify.com/storefront/web-components.js`) for store/cart/product/variant primitives.
- **Custom/PIM data** via the worker JSON API (`cf-worker-webflow-sync`: `/collection`, `/product`, `/search`, `/recs`, `/config`) where Shopify Web Components can't reach (search index, recommendations, Xano PIM fields).

**Principles**
1. **Tokens first** — no hardcoded colors/sizes in components; everything resolves from `--pim-*` custom properties (with literal fallbacks).
2. **Islands architecture** — Webflow owns the page chrome; commerce regions are self-contained islands mounted into known placeholders.
3. **Fluid by default** — `rem` + `clamp()`, `auto-fill` grids, no fixed pixel layouts (see §4).
4. **Progressive enhancement & a11y** — semantic HTML, keyboard-operable, `prefers-reduced-motion`/`prefers-contrast` honored, focus-visible rings.
5. **AEO-ready** — every page emits structured data and semantic markup for answer engines (see §13).
6. **Consent-gated personalization** — no tracking/personalization without consent (see §7).

---

## 2. Architecture & delivery

```
Shopify Storefront Web Components  ─┐
                                    ├─►  Design-system components (tokens + classes)
Worker JSON API (PIM/Xano/Shopify) ─┘        │
                                              ▼
            Webflow page (mount points) + shared footer/header embeds
```

- **Source of truth:** `webflow-embeds/*.html` → compiled to `workers/webflow-sync/src/embed-*.ts` → served at `GET /embed/*`. Build: `node workers/webflow-sync/build-embed-*.mjs`; deploy: `wrangler deploy`.
- **Page wiring:** Webflow loads `<script src=…/embed/footer>` (global) + the relevant island scripts; provides empty mount elements (`#mainpdp`, `#collection-div`, `#filter-wrap`, `#card-column`, `#pdp-pairs-well`, `#pdp-add-cart`, `#pim-collection`).
- **Config:** `window.__SYNC = { shop, pim, consent }`; defaults to `hx-stage.myshopify.com`.

---

## 2.1 State management (human + agent state managers)

The storefront is a **dynamic reactive component build system**: Webflow is the
content-curation + compile layer, Shopify Web Components stream commerce data, and a worker
API serves PIM/search/recs. Multiple kinds of *state* flow through the same components, owned
or observed by **human** managers (editors, merchandisers) and **agent** managers
(recommendation engines, agentic shoppers, AI coding agents). The design system is the shared
contract that keeps that state legible to both.

| State domain | Source / store | Human manager | Agent manager | How the system exposes it |
|---|---|---|---|---|
| **Content** (copy, media, page structure, merchandising) | Webflow (compiles to markup + Variables) | Editors curate in Webflow | AI coding agents edit embeds/components | Stable mount points + class/ID hooks |
| **Commerce** (catalog, variants, inventory, price, cart, auth) | Shopify | Merchants in Shopify admin | Agentic shoppers read/buy | Shopify Web Components + worker JSON API + JSON-LD |
| **Catalog / PIM** (normalized products, translations, recs source) | Xano (workspace 4) | Ops normalize PIM | Recs engine reads | `/collection` · `/product` · `/search` |
| **UI / session** (selected variant, cart, recently-viewed, filters, modal) | Client (`_pdpSelectedVariant`, localStorage cart, `__pim_rv`) | — (set by user actions) | Personalization agent reads recently-viewed | Documented globals + hooks |
| **Consent** | `window.__SYNC.consent` / `pim_consent` cookie | User choice via banner | All agents must honor it | `personalizationAllowed()` gate |
| **Personalization / recommendations** | Worker `/recs` (+ GA4 later) | — | Recs agent owns | `/recs?handle=&rv=`, consent-gated |
| **Design tokens** (the visual contract) | `tokens/*.json` → CSS vars + JS | Designers (Figma/Tokens Studio) | AI tooling reads/writes | `--pim-*` custom properties + JS constants |

**Principles for shared state**
- **One addressable surface.** Stable hooks (`#mainpdp`, `#qv-dialog`, `.cardcolumn`, …) and
  global APIs (`window._cartAdd`, `_pdpSelectedVariant`, `_variantLabel`, `__pimRvTypes`) are
  the contract both humans (in Webflow) and agents target — never ad-hoc selectors.
- **Machine-readable everywhere.** State that agents must act on is exposed as JSON (worker
  API), JSON-LD (structured data), or typed constants (tokens.js) — not locked in markup.
- **Consent is the shared gate.** Human and agent managers both honor `personalizationAllowed()`;
  no personalization/tracking state is read or written without consent.
- **Single source of truth per domain.** Each state domain has exactly one owner/store; the
  design system binds the views, it doesn't fork the state.
- **Verifiable by contract.** The acceptance criteria in each feature spec are the checks an
  agent (or human) validates a change against, so automated edits stay safe.

---

## 3. Design tokens (canonical)

All components reference `var(--token, fallback)`. Define once on `:root` (Webflow Variables / footer). **Normalize drift before adopting** (`--pim-color-primary` → one value; `--pim-color-text-muted` → one; `--pim-color-overlay` → one).

**Color:** `--pim-color-primary` (#1a1a1a), `-primary-hover` (#333), `-accent` (#31abff),
`-bg` (#fff), `-bg-surface` (#f5f5f5), `-bg-muted` (#f0f0f0), `-border` (#ddd),
`-border-light` (#eee), `-border-separator` (#e5e7eb), `-text-secondary` (#555),
`-text-muted` (#999), `-text-description` (#444), `-text-inverse` (#fff), `-disabled` (#ccc),
`-focus` (#4A90D9), `-overlay` (rgba(0,0,0,.5)), `-sale` (#e53e3e), `-new` (#38a169),
`-bestseller` (#d69e2e).

**Radius:** `--pim-radius-sm/-md/-lg/-xl/-full` (.25/.375/.5/.75rem / 50%).
**Transition:** `--pim-transition-fast/-normal` (.2s/.3s).
**Type:** `--pim-font-family`.

**Add for MVP (currently hardcoded):** spacing scale `--pim-space-1..8`, fluid type scale
`--pim-text-xs..2xl` (via `clamp()`), `--pim-shadow-sm/-md`, `--pim-z-modal/-drawer/-overlay`,
breakpoints `--pim-bp-sm 479px / -md 768px / -lg 991px`.

---

## 3.1 Base CSS layer — Normalize, fallbacks & overrides

The system ships a **Normalize/reset** baseline so browser defaults are predictable across
the Webflow page and the injected islands. Cascade order (lowest → highest precedence):

1. **Normalize** — `normalize.css` (or a minimal reset) as the *fallback* baseline: islands
   assume `box-sizing: border-box`, predictable `button`/`a`/`img`/list defaults, and
   consistent margins. Scope it to island roots (or use `@layer`) so it does **not** re-reset
   the whole Webflow page and fight Webflow's own reset. Webflow's normalize also provides the
   **form** base (`.w-input`, `.w-select`, `.w-checkbox`, success `.w-form-done`, error
   `.w-form-fail`); the design system **layers state styling on top** of these rather than
   re-resetting form controls — re-resetting breaks Webflow's form error/success UX. See Forms (§8.1).
2. **Tokens** — `:root { --pim-* }` (Webflow Variables / footer). Theming layer.
3. **Components** — `.pim-*` / `#qv-*` / `.pairs-*`, every value resolving from a token with a
   literal fallback (`var(--pim-color-primary, #1a1a1a)`).
4. **Overrides** — scoped `!important` used **only** to defeat host (Webflow) styling
   (buttons, filters, `.custom-select`), and kept token-driven so they still theme.

Rules: any brand-variable declaration resolves from a token-with-fallback; `!important` is
allowed only in the overrides layer against host styles, never between our own components;
Normalize is a required dependency, not optional. Migrate to native CSS **`@layer`
(normalize < tokens < components < overrides)** once the build supports it, to make
precedence explicit and retire most `!important`.

---

## 4. Fluid design (global rules)

- **Units:** `rem` for sizing, `clamp(min, preferred-with-vw, max)` for type and key spacing. No fixed `px` page widths.
- **Full width:** page wrapper (`.wrap-full`) → `max-width:none; width:100%`; gutters live on the inner grid, not the wrapper.
- **Grids:** product grids use `repeat(auto-fill, minmax(<min>, 1fr))` so items reflow fluidly; never a fixed column count on desktop.
- **Two-column layouts** (collection sidebar+grid, PDP gallery+buy-box): single column at `≤768px`; remove fixed `min-height`s on mobile so content is a continuous scroll.
- **Sticky** only where the parent allows content-height children (`align-items:start`); never sticky on mobile.
- **Breakpoints:** `768px` (layout collapse), `479px` (phone), `720px` (dialogs).
- **Motion/contrast:** honor `prefers-reduced-motion` and `prefers-contrast: more`.

---

## 5. Component layering (atomic)

| Level | Items |
|---|---|
| Atoms | token, button (`.pim-btn`), field/select (`.custom-select` — see note), badge, price, swatch, image, icon |
| Molecules | product card (`.pim-card`), filter chip (`.pim-filter`), variant switch (`.pim-variant-thumb`), qty stepper, cart line, pairs row (`.pairs-row`) |
| Organisms | Cart drawer, Collection grid, PDP, Quick View, Consent banner, Login |
| Templates | Collection page, Category page, Tag page, PDP, Cart |

> **Select / dropdown:** the custom dropdown — `.custom-select` (text-only `<select>` options
> upgraded to a styled, keyboard-operable listbox via `upgradeSelect`) — is already specified
> and owned by the **`pdp-embeds`** skill. Reuse it for all variant/option dropdowns
> (LAYOUT, SWITCH, etc.); do not re-implement. It is token-driven and a11y-compliant.

---

## MVP feature specs

Each spec lists **scope · data/SWC · hooks · states · a11y · AEO · acceptance**.

## 6. Cart

- **Scope (MVP):** add/remove/update qty, line variant label (full options), subtotal, checkout, mini-drawer + badge, persistence.
- **Data/SWC:** `<shopify-cart id="main-cart">` for the declarative path **or** the localStorage cart with checkout permalink `https://{shop}/cart/{numericVariantId}:{qty}` (current PIM path). Variant IDs are real Shopify IDs resolved by SKU.
- **Hooks:** global API `window._cartAdd({ variantId, title, variant, price, image, handle, qty })`; render `.cart-item`, `.cart-item-title`, `.cart-item-variant`, badge `updateBadge`. **Variant label** = `window._variantLabel(v)` → `option1 / option2 / option3` (skips "Default Title").
- **States:** empty, item added (drawer opens), qty 0 → remove, out-of-stock line, loading→checkout.
- **a11y:** drawer is a focus-trapped dialog; `aria-live` on badge/subtotal; Esc closes.
- **AEO:** cart is `noindex`; no structured data.
- **Acceptance:** ✅ line shows **all** variant options; ✅ qty edits update subtotal + badge; ✅ checkout permalink uses numeric Shopify variant id; ✅ survives reload.

## 7. Consent

- **Scope (MVP):** banner with Accept / Reject / Customize (analytics, marketing, personalization categories); persists choice; gates GA4 + first-party personalization; re-open link in footer.
- **Data:** writes `window.__SYNC.consent = { analytics, marketing, personalization }` and a `pim_consent` cookie; integrates with Shopify Customer Privacy API / Google Consent Mode v2 (`gtag('consent', …)`).
- **Hooks:** `personalizationAllowed()` gate (already used by recently-viewed/recs); honors `__PIM_PERSONALIZATION`, `__SYNC.consent.analytics===false`, `pim_consent=denied`.
- **States:** unset (banner shown), granted, denied, partial; reduced-motion safe.
- **a11y:** banner is a landmark, not a focus trap (non-blocking); fully keyboard operable; persists across pages.
- **AEO:** banner must not block crawlers/answer-engines from content (render content regardless of consent).
- **Acceptance:** ✅ default-deny for tracking until choice; ✅ personalization no-ops without consent; ✅ choice persists; ✅ Consent Mode signals fire.

## 8. Login (Customer Accounts)

- **Scope (MVP):** login/logout entry in header, account state reflection (logged-in name/CTA), link to Shopify Customer Account, order history link.
- **Data/SWC:** Shopify **Customer Account API** / new customer accounts (passwordless). MVP can deep-link to the hosted customer account; full embed is post-MVP.
- **Hooks:** header `#account-link` reflects auth state; `__SYNC.customer` if available.
- **States:** logged-out (Login), logged-in (name + Account/Logout), loading.
- **a11y:** menu is a keyboard-operable disclosure; clear focus order.
- **AEO:** account pages `noindex`.
- **Acceptance:** ✅ correct state shown; ✅ login/logout round-trips; ✅ no PII in client logs.

## 8.1 Forms (fields · states · validation)

> ⚠️ **Webflow normalize interplay:** Webflow ships its own normalize + form base
> (`.w-form`, `.w-input`, `.w-select`, `.w-checkbox`, `.w-form-done`, `.w-form-fail`). Our
> Normalize (§3.1) is a **fallback** — on Webflow pages, **layer state styling on top**; do
> **not** re-reset form controls or you break Webflow's built-in error/success behavior.
> Island forms (not Webflow-rendered) use our Normalize as the baseline.

- **Scope (MVP):** newsletter, search, login, consent — `text/email/select/checkbox` fields
  with default / focus / error / success / disabled states + inline validation.
- **States (token-mapped, never color-only — pair with icon/text):**
  default `border --pim-color-border` · focus `outline --pim-color-focus` (focus-visible) ·
  **error** `--pim-color-sale` (#e53e3e) · **success** `--pim-color-new` (#38a169) ·
  disabled `--pim-color-disabled`.
- **Validation / regex:** prefer native HTML5 — `required`, `type="email"`, `pattern="…"`,
  `minlength/maxlength`. Style with **`:user-invalid` / `:user-valid`** (post-interaction),
  not bare `:invalid` (fires before the user types). Common patterns: email
  `^[^@\s]+@[^@\s]+\.[^@\s]+$`; locale-specific phone/postal. Client JS only for cross-field
  rules; **never** trust client validation server-side.
- **Error/success UX:** field-level message adjacent to the field, associated via
  `aria-describedby`, toggle `aria-invalid="true"`; form-level result through Webflow's
  `.w-form-done` / `.w-form-fail` wrapped in `aria-live="polite"`.
- **Dropdowns:** use the `.custom-select` from the **`pdp-embeds`** skill (don't re-implement).
- **a11y:** every field has a real `<label>`; errors programmatically associated; submit
  result announced; fully keyboard operable.
- **Acceptance:** ✅ states token-driven + visible (not color-only); ✅ regex fires on
  `:user-invalid` after interaction; ✅ errors associated + announced; ✅ Webflow form
  controls not double-reset; ✅ `.w-form-done`/`.w-form-fail` styled to tokens.

## 9. PDP (Product Detail Page)

- **Scope (MVP):** gallery (thumbnails + zoom), title, vendor, price/compare-at, **multi-option variant selectors** (option1/2/3, swatches + custom selects), qty, Add to Cart, Buy Now, description, **Pairs well with**.
- **Data/SWC:** `<shopify-context type="product">` + `<shopify-variant-selector>` **or** worker `/product?handle=`. Variant resolution must match across **all** option dimensions (`findVariant()` → `_pdpSelectedVariant`).
- **Hooks:** `#mainpdp`, `.pdpwrapper`/`.pdpherowrap`/`.pdpfeature`/`.pdp-title`, `#pdp-add-cart` (→ `_cartAdd`), `pdp-ready` event + `window._pdpProduct`/`_pdpSelectedVariant`, `#pdp-pairs-well`.
- **States:** variant available / sold-out (disable CTA), no compare-at, single-variant (hide selectors), image-only vs multi-image, **mobile single-column continuous scroll** (no hero/title cutoff).
- **a11y:** gallery arrows/thumbs keyboard-operable; selectors are real form controls; price + availability in an `aria-live` region on variant change.
- **AEO:** `Product` + `Offer` JSON-LD (name, image, sku, price, priceCurrency, availability, brand, aggregateRating if present); `BreadcrumbList`; descriptive `<h1>`; canonical URL.
- **Acceptance:** ✅ all option dimensions selectable & resolve to correct variant; ✅ cart line carries full variant; ✅ mobile shows title directly under hero; ✅ Pairs-well renders (single mount).

## 10. Collection

- **Scope (MVP):** full-width layout, **sticky filter/tag column (desktop)**, **fluid product grid**, product cards with quick-add + Quick View, empty state, lazy images.
- **Data/SWC:** `<shopify-context type="collection">` + `<shopify-list-context query="collection.products">` **or** worker `/collection?type=`.
- **Hooks:** `.wrap-full` (full width), `.collectiongrid`/`#collection-div` (grid `240px 1fr`), `.filterwrap`/`#filter-wrap` (sticky desktop, static ≤768px), `.cardcolumn`/`#card-column` (`auto-fill minmax(260px,1fr)`), `.pim-card`, `[data-quickview]`, `[data-action="cart"|"buy"]`.
- **States:** loading skeleton, empty, filtered, single column (mobile), card hover/slider.
- **a11y:** cards are a roving-tabindex group (Arrow/Home/End); filter buttons are `aria-pressed`.
- **AEO:** `CollectionPage` + `ItemList` (ordered product URLs) JSON-LD; `<h1>` = collection name.
- **Acceptance:** ✅ 100% width; ✅ sticky filters on desktop, stacked on mobile; ✅ grid reflows fluidly; ✅ QV/quick-add work.

## 11. Tags

- **Scope (MVP):** a Collection view filtered by tag; tag chips; URL-addressable (`/tags/<tag>`); shares the Collection organism.
- **Data:** worker `/search?…` or `/collection` filtered by `tags[]`; tag list from catalog.
- **Hooks:** reuse Collection hooks; active tag chip `.pim-filter.is-active`.
- **States:** valid tag (results), unknown/empty tag (empty state), multi-tag (post-MVP).
- **a11y/AEO:** same as Collection; `CollectionPage` + `ItemList`; canonical per tag; `rel=prev/next` if paginated.
- **Acceptance:** ✅ tag URL renders the filtered grid; ✅ chips reflect active tag; ✅ empty state for no matches.

## 12. Category

- **Scope (MVP):** top-level category landing (e.g., Gaming Headsets) = a curated Collection with optional subcategory nav + hero; maps to `product_type`/collection handle.
- **Data:** worker `/collection?type=` (by `product_type`) or a Shopify collection.
- **Hooks:** Collection organism + `.category-hero`, subcategory `nav.pim-filters-nav`.
- **States:** with/without hero; subcategories present/absent.
- **a11y/AEO:** `CollectionPage` + `BreadcrumbList` (Home → Category); descriptive intro copy for answer engines.
- **Acceptance:** ✅ category resolves to its products; ✅ breadcrumb correct; ✅ subcategory nav filters.

## 13. Quick View

- **Scope (MVP):** modal preview without leaving the grid — **image gallery thumbnails**, **variant color switch**, title/vendor/price/short desc, Add to Cart (selected variant), Buy Now, "View full details".
- **Data:** product from the loaded collection set (no extra fetch) or `/product`.
- **Hooks:** `#qv-dialog` (native `<dialog>`), `#qv-image`, `#qv-thumbs`/`.qv-thumb` (**gallery from `collectImages(p)`**), `#qv-variants`/`.qv-variant-thumb` (**variant switch**, selects variant for cart), `#qv-title/-vendor/-price/-desc`, `.qv-actions`, `#qv-pdp-link`.
- **States:** single image (no thumbs), single variant (no switch), gallery + variants, sold-out.
- **a11y:** native dialog (focus trap + Esc); thumbs/swatches are buttons; image has alt.
- **AEO:** none (it's a UI overlay; the PDP carries structured data).
- **Acceptance:** ✅ thumbnails appear for multi-image products; ✅ variant switch present for ≥2 image variants; ✅ Add to Cart uses the selected variant.

## 14. AEO (Answer Engine Optimization)

Make every page consumable by AI answer engines & search.

- **Structured data (JSON-LD):** `Organization`/`WebSite` (site), `Product`+`Offer`+`AggregateRating` (PDP), `BreadcrumbList` (PDP/Category/Tag), `ItemList`+`CollectionPage` (Collection/Tag/Category), `FAQPage` where Q&A content exists.
- **Semantic HTML:** one `<h1>` per page, logical heading order, `<nav aria-label>`, `<main>`, descriptive link text, real `<button>`/`<a>` (no div-buttons).
- **Metadata:** unique `<title>`/`meta description`, canonical, Open Graph/Twitter cards, `hreflang` for localized variants, `lang` attribute.
- **Content:** crawlable product copy (not consent-gated, not client-only where avoidable); spec tables in real markup; image `alt`.
- **Crawlability:** server-rendered or hydration-friendly content; `sitemap.xml` + `robots.txt`; fast LCP/CLS (fluid images with intrinsic size).
- **Acceptance:** ✅ valid JSON-LD (Rich Results test) on PDP/Collection/Tag/Category; ✅ unique title/canonical per page; ✅ content present without JS where feasible; ✅ Core Web Vitals pass.

---

## 14.1 AEO + lifecycle automation (tags: products · users · sessions · upstream)

**Tags are the shared, machine-readable substrate** that both drive **lifecycle automation**
and power **AEO** (faceted discovery). The same tags are read by humans (Shopify admin,
Webflow curation), agents (recommendations, agentic shoppers), and upstream systems — and are
queried with **Shopify's search syntax** (`field:value`, `AND/OR/NOT`, ranges `:>` `:>=` `:<`
`:<=`, prefix `*`, phrase `"…"`, grouping `( )`), the same grammar across Admin, Storefront,
and customer queries.

### Tagged entities & example taxonomy
- **Products** — `lifecycle:preorder|live|clearance|discontinued`, `restock:soon`,
  `channel:web|retail`, `badge:new|bestseller|sale`, attribute facets (`switch:linear`).
- **Users (customers)** — `segment:vip|wholesale`, `churn-risk`, `consent:granted|denied`,
  `loyalty:tier-2`, `cs:complaint-open`.
- **Sessions / orders** — `fraud:review|cleared`, `fulfillment:backorder|dropship`,
  `source:ai-agent`, `cart:abandoned`.

### Query interface (Shopify search syntax)
- Segment VIPs without an open complaint — `tag:vip AND -tag:'cs:complaint-open'`
- Web products needing restock — `tag:restock:soon AND tag:channel:web AND inventory_total:<=10`
- Orders flagged for fraud in a window — `tag:fraud:review AND created_at:>'2026-06-01'`
- Facets for AEO — `tag:badge:*` (any badge), `-published_at:*` (find unpublished)
> Value must immediately follow `field:` (no space); quote composite values; `NOT` must be
> capitalized (or use `-`); ranges use `:>`/`:>=`/`:<`/`:<=` (not `:=`). Malformed queries are
> ignored field-by-field — validate with the `Shopify-Search-Query-Debug=1` header.

### Upstream services — tags as the integration contract
| System | Writes tags (inbound) | Reads / acts (outbound) | Storefront / AEO effect |
|---|---|---|---|
| **WMS** (warehouse) | `fulfillment:backorder\|dropship`, `bin:*` | fulfillment routing | availability + `Offer.availability` schema |
| **ERP** | `lifecycle:discontinued`, price/cost master, `channel:*` | catalog + pricing master | price/availability accuracy; `Offer.price` |
| **Fraud** | `fraud:review\|cleared` | checkout gating / holds | block/hold; never personalize a flagged session |
| **Customer Service** | `cs:complaint-open`, `segment:vip` | routing, SLA, win-back | personalization signal + `FAQPage` schema |

### Sync, idempotency & consent
- **Channels:** real-time (Shopify webhooks / GA4) vs ~15-min cron (ERP / WMS). Tag writes are
  **declarative + idempotent** — reconcile the full tag set, never blind-append duplicates.
- **Consent:** user/session tags that drive personalization are gated by
  `personalizationAllowed()`; fraud/compliance tags are honored regardless of consent.
- **Source of truth:** PIM (Xano) reconciles upstream tags before they reach Shopify/Webflow;
  the worker exposes them via `/collection` / `/search` as `tags[]`.
- **AEO tie-in:** product tags map to structured-data facets (category, availability,
  attributes) and `ItemList` / `CollectionPage` faceting, so lifecycle state is discoverable
  and queryable by answer engines and agentic shoppers.
- **Acceptance:** ✅ lifecycle/segment/fraud tags round-trip with upstream systems
  idempotently; ✅ search-syntax segments resolve correctly; ✅ personalization tags
  consent-gated; ✅ tag-driven facets surface in structured data.

---

## 15. Cross-cutting requirements

- **i18n:** Webflow Localization for static content; runtime i18n (e.g. `vue-i18n`) for dynamic islands; product translations from Shopify/Xano; detect locale from URL/`lang`; `hreflang` emitted.
- **a11y baseline:** WCAG 2.1 AA — focus-visible, contrast (token-driven), keyboard paths for every interaction, `prefers-reduced-motion`, dialogs trap focus.
- **Performance:** lazy images, `auto-fill` grids, no layout-shift (reserve image aspect-ratio), embeds cached (`Cache-Control`), defer non-critical JS.
- **Privacy:** personalization/tracking strictly behind Consent (§7); no PII in client logs; tokens/secrets never shipped to the browser.
- **Multi-tenant:** every data call scoped by `shop` (`resolveShop`); empty (not all-merchant) when shop is missing.

## 16. MVP definition of done

A storefront is MVP-complete when: Collection + Category + Tag pages render fluid grids
with sticky desktop filters; PDP supports multi-option variants with correct cart lines and
Pairs-well; Quick View shows gallery + variant switch; Cart adds/edits/checkouts with full
variant labels; Consent gates tracking; Login reflects auth state; all pages emit valid
structured data (AEO) and pass a11y + Core Web Vitals. All driven by the normalized token set.
