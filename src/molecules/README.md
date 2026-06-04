# Molecules

Small compositions of atoms. Each `.css` here is imported into `@layer molecules`
in `src/index.css`.

Planned (port from `pim-design-components` / `pdp-embeds` skills):
- `product-card.css` — `.pim-card` (media, slider, title, price, actions)
- `filter.css` — `.pim-filter` tag/collection chips
- `variant-switch.css` — `.pim-variant-thumb` / `.qv-variant-thumb`
- `qty-stepper.css`
- `cart-line.css` — `.cart-item*`
- `pairs-row.css` — `.pairs-row` (product-linked recommendation row)

Rules: token-driven only; no `!important` (use the overrides layer); states via
`:hover` / `:focus-visible` / `[aria-*]`.
