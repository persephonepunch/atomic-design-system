# Architecture — Auth / Asset / Design-Component IA

This repo is the **design foundation** of a larger information architecture (IA) that bridges
three concerns for both **human and agent state managers**:

| Foundation | Owns | Lives in |
|---|---|---|
| **Design Components** | tokens, atoms→organisms, the layered cascade | **this repo** (`atomic-design-system`) — `DESIGN-SYSTEM.md`, `tokens/`, `src/` |
| **Assets** | image/file bytes + a registry of what exists (incl. `alt`) | **GAM** — see [`GLOBAL-ASSET-MANAGEMENT.md`](./GLOBAL-ASSET-MANAGEMENT.md) |
| **Auth / Identity** | who the user is, across providers + the avatar | crm-sync worker (Google OAuth `picture` → `avatar_url` → `/auth/me`) + Xano |

The intent: a **new project bootstrapped from this repo** unifies the three into one IA, so a
single set of tokens, asset references, and identity claims is consumed consistently across
every surface (Webflow storefront, community, agents).

## Why bridge them
Today each app wires in its own design code, its own asset storage, and its own auth — which
produced drift, regressions, and vendor lock-in (e.g. a paid image API per app). Binding them
to **one contract** (tokens + asset registry + identity) means a change propagates once and the
system stays legible to humans (editors/merchandisers) and agents (recs, agentic shoppers, AI
coding agents) alike.

## How the foundations connect
- **Design ↔ Asset:** components reference assets by **id/URL from the registry**, never a
  vendor SDK; `alt` text lives in the asset registry (feeds AEO).
- **Auth ↔ Asset:** the avatar is an asset — the Google `picture` (or a user upload) is stored
  via the asset service and referenced from the identity record (`profile_image` / `avatar_url`).
- **Design ↔ Auth:** account/login/consent UI are design-system organisms (see `DESIGN-SYSTEM.md`
  §6–§8.1) driven by the same tokens.

## Build constraint — non-destructive / dry setup
The new project must be **additive**. It bootstraps from this repo and **references** the
existing systems (crm-sync, webflow-sync, yonsei community) **read-only** — it does **not**
modify or break live apps. Scaffold + bridge only:
- pull design tokens/components from this repo,
- define the asset `/asset` contract + `assets` registry (additive),
- reference the existing auth `/auth/me` (don't fork identity).

Migrate real apps onto the bridge **incrementally**, one surface at a time, only after the
shared contracts are proven.

## Status pointers
- Design foundation: this repo (`DESIGN-SYSTEM.md` is the canonical spec).
- Asset foundation: [`GLOBAL-ASSET-MANAGEMENT.md`](./GLOBAL-ASSET-MANAGEMENT.md) (proposed).
- First migration in flight: [`AVATAR-SPRINT.md`](./AVATAR-SPRINT.md) (Uploadcare removed → Xano/asset-service).
