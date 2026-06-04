# Global Asset Management (GAM)

Separate **asset storage + data flows** from individual app dependencies. One asset layer that
every app consumes, instead of each app wiring in *where bytes live*.

## Problem
Asset handling is fragmented per app:
- **webflow-sync (PIM):** Cloudflare R2 bucket `game-pim-media`, serves `/media/*`, mirrors Shopify → Xano → R2 product images.
- **community (yonsei):** was **Uploadcare** (fee-based) → being removed in favor of Xano (see [`AVATAR-SPRINT.md`](./AVATAR-SPRINT.md)).
- **crm-sync:** header/footer embeds; avatar concept with no canonical store.
- Plus **Shopify CDN**, **Webflow assets**, **Xano file storage**.

Each app references bytes directly and differently → vendor lock-in, no single registry, no
single place for `alt`/ownership/tags, can't swap storage without touching every app.

## Architecture — separate three concerns
| Concern | Owner | Role |
|---|---|---|
| **Bytes** | **Cloudflare R2** (single bucket, per-tenant prefix) | durable object store; no egress/SDK fees; no fee-based third party |
| **Registry / source of truth** | **Xano** `assets` table | *what* assets exist + metadata (incl. `alt`) |
| **Delivery** | **one shared asset worker** (`/asset/*`, generalize webflow-sync `/media/*`) | upload → (R2 + register in Xano), serve (immutable cache), transform (resize/format), presign |

**Resolves the Xano-vs-R2 question:** **R2 = bytes, Xano = source-of-truth registry, worker =
delivery.** "Xano as source of truth" holds (it owns the asset records); R2 just stores bytes;
no paid API.

### `assets` table (Xano) — sketch
```
id, r2_key, url, type, size, width, height,
alt,                      -- AEO/SEO; required for images
owner_type, owner_id,     -- user | product | tenant
tags[], source,           -- upload | shopify-mirror | webflow | external
checksum, created_at
```

### Asset service contract (worker)
- `POST /asset` (multipart `content`) → store in R2 → register in Xano → `{ id, url, alt }`
- `GET  /asset/{id}` (or `/media/{key}`) → R2, `Cache-Control: public, max-age=31536000, immutable`
- `GET  /asset/{id}?w=&h=&fmt=` → on-the-fly transform (optional)
- (optional) `POST /asset/presign` for large/direct uploads

## Data flows
- **Ingest:** app/client → `POST /asset` → R2 bytes + Xano registry (with `alt`, owner, tags) → returns id/url.
- **Mirror:** Shopify / Webflow / external image → service ingests → R2 + Xano (the PIM image mirror already does the Shopify→R2 half).
- **Serve:** `/asset/{id}` → R2 (immutable cache) → optional transforms.
- **Reference:** apps store the **asset id / canonical URL** in their records (`profile_image`,
  product image, `og_image`) — never a vendor SDK or per-app bucket.

## Migration (incremental, non-destructive)
1. Stand up the asset service + `assets` registry (additive; can reuse webflow-sync's R2).
2. New uploads go through `/asset` (the avatar sprint is the first — re-point `/auth/avatar` → `/asset`).
3. Backfill/mirror existing images into the registry over time.
4. Apps switch references from direct URLs → asset ids as each is touched. No big-bang.

## Ties
- **AEO:** `alt` lives in the registry → consistent, machine-readable image metadata.
- **Agentic commerce:** assets become queryable structured data.
- **Design system:** one asset contract for components (see `DESIGN-SYSTEM.md`).
- **Multi-tenant:** per-tenant R2 prefix + `owner`/tenant scoping in the registry.
