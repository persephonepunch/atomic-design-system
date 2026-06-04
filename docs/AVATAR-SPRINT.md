# Avatar Sprint — Uploadcare → Xano (first GAM migration)

Migrate avatar/photo handling off **Uploadcare** (fee-based) to **Xano as source of truth**
for the story-story.ai community + auth. This is the first migration toward
[`GLOBAL-ASSET-MANAGEMENT.md`](./GLOBAL-ASSET-MANAGEMENT.md). Started 2026-06-04.

> The code lives in the **`00story-tiptap/yonsei`** project (story-story.ai community), not in
> this repo. This doc is the portable record so the work is resumable from here.

## Done (in-place edits in `00story-tiptap/yonsei`)
- `theme/assets/js/community-profile.js` — removed Uploadcare; native `<input type=file>` →
  canvas square-crop + downscale 512px → `POST {XANO_AUTH}/auth/avatar` (multipart `content`)
  → store returned url in `profile_image`; `alt="Profile photo of {name}"` (edit-preview + view-mode).
- `theme/assets/js/xano-auth-modal.js` — signup avatar refactored the same way; removed `UPLOADCARE_KEY`.
- `cms/_data/env.js` — removed `UPLOADCARE_PUBLIC_KEY`. `menu-a3c17a.webflow.css` — removed `.uploadcare`.
- `theme/profile.html` — deleted (legacy duplicate).
- Verified zero `ucarecdn` / `uploadcare.openDialog` / `UPLOADCARE_KEY` references remain.
- `uploadcare_url` field name (slider-toolbar.js / card-renderer.js) is legacy naming only —
  not a paid dependency; optional rename later.

## Next step — create the Xano endpoint (then deploy)
1. **Xano endpoint** (MCP or dashboard) — instance `xerb-qpd6-hd8t`, workspace 4, auth API
   group `api:hJgoiIwh`:
   - `POST /auth/avatar` — input `content` (type **image**) → store in **Xano file storage
     (public)** → response `{ "url": content.url }`. Optional: require auth token + size/type guard.
   - Caveat: Xano MCP endpoint/field creation may hit a known workspace bug → fall back to the dashboard.
   - **GAM-ready alternative:** create the shared `POST /asset` endpoint instead and point the
     client at it, so the avatar is on the asset service from day one.
2. **Deploy** `yonsei` (mechanism TBD — Netlify / worker / Webflow export). **Do not deploy until
   the endpoint exists** — the client would 404 otherwise.

## Avatar source context
- Community user system = Xano auth group `api:hJgoiIwh` (`/auth/me`, `/auth/profile`,
  `profile_image` text field holds the URL).
- The working **Google OAuth `picture` → `avatar_url` → `/auth/me`** is in the **crm-sync worker**
  (not shop-chat-agent). `storefront_users` (Xano table 180) has **no `avatar_url` field** —
  writes to it are silently dropped.
- Avatar can default to the Google `picture`, overridable by a Xano/asset-service custom upload.

## Constraints
Xano = source of truth; no fee-based APIs; ALT required for AEO; don't duplicate story-story.ai;
changes are additive / non-destructive.
