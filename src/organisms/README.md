# Organisms

Self-contained, data-driven regions ("islands") mounted into Webflow placeholders.
Imported into `@layer organisms`.

Planned (see DESIGN-SYSTEM.md feature specs):
- `cart.css` — drawer + badge (`window._cartAdd`, checkout permalink)
- `collection.css` — `.wrap-full` / `.collectiongrid` / `.filterwrap` (sticky desktop) / `.cardcolumn` (fluid)
- `pdp.css` — `#mainpdp` / `.pdpwrapper` / `.pdpfeature`; mobile single-column
- `quick-view.css` — `#qv-dialog` (gallery thumbs + variant switch)
- `consent.css` — consent banner (gates personalization)
- `forms.css` — login / newsletter / search field groups (§8.1)

Data via Shopify Storefront Web Components and/or the worker JSON API
(`/collection`, `/product`, `/search`, `/recs`). Behavior lives alongside in JS
(or, later, Vue islands).
