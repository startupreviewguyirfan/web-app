# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Product

Startup Review Guy is the website for a YouTube channel run by Irfan (developer in Toronto, 10+ years building/scaling web apps) who reviews new startups daily. The site has two goals, in priority order:

1. Showcase every reviewed startup with its own SEO-optimized page (e.g. `/startups/claude-ai-agent`).
2. Generate partnership leads — startups reaching out to sponsor a paid review via `/partner`.

There's also a lightweight admin panel (`/admin-access`, Google OAuth only, allow-listed emails) for Irfan to manage startup entries and incoming partnership inquiries.

**Note on origin:** the original product brief (kept at `attached_assets/Pasted-Project-Overview-*.txt`) specified Next.js + Prisma + NextAuth + Vercel. The project was rebuilt as a pnpm-workspace monorepo instead — React/Vite frontend and a Hono API both deployed to a single Cloudflare Worker (`artifacts/api-server`, static assets + `/api/*`), Supabase Postgres via Drizzle, and hand-rolled Google OAuth — because Vercel wasn't used for hosting and Node-only auth libraries don't run on Workers. The product requirements (pages, data model, SEO goals) from that original brief still apply; only the implementation stack differs. Treat the brief as historical context, not as a guide to current architecture.

## Pages

- `/` — Landing page: Irfan's personal brand hero, featured startups, stats
- `/startups` — Startup listing with search/filter/pagination
- `/startups/:slug` — Individual startup detail (SEO-optimized)
- `/partner` — Partnership contact form
- `/admin-access` — Admin panel (Google OAuth, allow-list protected)

## Commands

- `cp .env.example .env` then fill in `DATABASE_URL` (Supabase session-pooler string) and `SESSION_SECRET` — required before anything runs.
- `pnpm install`
- `pnpm --filter @workspace/db run push` — create/sync DB tables from the Drizzle schema (fast local iteration, no migration file)
- `pnpm run dev` — runs frontend (port 5100) + API (port 8080) together, `/api/*` proxied from 5100 to 8080 so it's same-origin locally
- `pnpm --filter @workspace/api-server run dev` — API only (Node, tsx watch)
- `pnpm --filter @workspace/api-server run dev:worker` — API only, under `wrangler dev` (Cloudflare Workers runtime, closer to prod)
- `pnpm --filter @workspace/startup-review-guy run dev` — frontend only
- `pnpm run typecheck` — typecheck everything (libs first via `tsc --build`, then artifacts/scripts)
- `pnpm --filter <name> run typecheck` — typecheck a single package
- `pnpm --filter @workspace/api-spec run codegen` — regenerate `lib/api-client-react` hooks and `lib/api-zod` schemas from `lib/api-spec/openapi.yaml` (run this after editing the OpenAPI spec; it also runs `typecheck:libs` after)
- `pnpm --filter @workspace/db run generate` — generate a versioned SQL migration from schema changes (`lib/db/migrations/`)
- `pnpm --filter @workspace/db run migrate` — apply pending migrations to `DATABASE_URL` (use against Supabase for anything meant to persist)
- `pnpm run build` — typecheck + build all packages

There is no lint script and no test suite configured in this repo currently — don't assume either exists.

## Architecture

pnpm workspace monorepo (`pnpm-workspace.yaml`: `artifacts/*`, `lib/*`, `scripts`), Node 24, TypeScript 5.9.

**`lib/api-spec/openapi.yaml`** is the single source of truth for the API contract. Running its `codegen` script generates:
- `lib/api-zod` — Zod request/response schemas, imported by the API server for validation
- `lib/api-client-react` — React Query hooks, imported by the frontend

When changing an API endpoint's shape, edit the OpenAPI spec first, run codegen, then implement the route and the frontend usage against the generated types — don't hand-edit the generated packages.

**`lib/db`** — Drizzle ORM + Postgres (`pg` driver). `src/schema/` has one file per table (`startups.ts`, `founders.ts`, `partner-inquiries.ts`) plus `zod` insert schemas via `drizzle-zod`. `createDb(connectionString)` in `src/index.ts` is a factory (returns `{ pool, db }`) shared by both API runtimes — Node and Workers construct it differently (see below).

**`artifacts/api-server`** — one Hono app (`src/app.ts`, routes + middleware, runtime-agnostic) with two thin entrypoints:
- `src/index.node.ts` — `@hono/node-server`, used for local dev
- `src/index.worker.ts` — Cloudflare Workers entrypoint (`wrangler.toml` config, deployed via `wrangler deploy`)

Never duplicate route/business logic between the two entrypoints — new behavior belongs in `app.ts` or `src/routes/`.

- `src/lib/db-middleware.ts` — picks the DB strategy per-request: if `c.env.HYPERDRIVE` is present (Workers), it creates a fresh pool per request via Cloudflare Hyperdrive and closes it in `finally` with `waitUntil`; otherwise (Node) it lazily creates one long-lived pool and reuses it. This is the key runtime-branching point in the codebase — don't "simplify" it into a single pooling strategy, the two runtimes have fundamentally different lifecycle models (long-lived process vs. short-lived isolate).
- `src/lib/env.ts` — `getConfig()` reads from `c.env` (Workers bindings/vars) falling back to `process.env` (Node) — use this instead of `process.env` directly in route code so it works on both runtimes.
- `src/lib/session.ts` — signed JWT session cookie (`hono/jwt` + `hono/cookie`), stateless — no server-side session table, works identically on Node and Workers.
- `src/middlewares/require-admin.ts` — guards `/admin/*` routes using the session.
- `src/routes/` — `health.ts`, `auth.ts`, `startups.ts` (public), `partner.ts` (public inquiry submission), `admin.ts` (CRUD for startups + founders, inquiry status updates; all behind `requireAdmin`).

**Auth flow** (hand-rolled Google OAuth 2.0 authorization-code flow — not Passport/NextAuth, since those rely on Node-only APIs that don't run on Workers):
1. `GET /api/auth/google` → generates a CSRF `state`, stores it in a short-lived httpOnly cookie, redirects to Google.
2. Google redirects back to `GET /api/auth/google/callback` with `code` + `state`.
3. Callback verifies `state`, exchanges `code` for tokens, fetches the profile from Google's userinfo endpoint, checks `email` against the `ADMIN_EMAILS` env var (comma-separated allow-list — no roles table).
4. On success: signs a JWT session cookie, redirects to `/admin-access`. On failure at any step: redirects to `/?auth=failed`.

**`artifacts/startup-review-guy`** — React 19 + Vite + Tailwind v4 + shadcn/ui (`src/components/ui`) + wouter for routing (not react-router) + TanStack Query (via the generated `@workspace/api-client-react` hooks). Pages live in `src/pages/`: `home.tsx`, `startups.tsx`, `startup-detail.tsx`, `partner.tsx`, `admin/index.tsx`, `admin/startup-form.tsx`.

**`artifacts/mockup-sandbox`** — standalone design-mockup scaffold, unrelated to the production app; don't wire product features into it.

## Data model

Three Drizzle tables (`lib/db/src/schema/`):
- `startups` — slug (unique, canonical URL id), name, tagline, description, logoUrl, youtubeVideoId, category, tags (text array), websiteUrl/twitterUrl/linkedinUrl, fundingStage, totalRaised, notableInvestors, lastRoundDate, revenueArr + revenueEstimated flag, competitors, useCase, verdict, reviewedAt, updatedAt, published.
- `founders` — belongs to a startup (`onDelete: cascade`), name, role, linkedinUrl, photoUrl.
- `partner_inquiries` — companyName, contactName, email, website, message, budgetRange, createdAt, status (`new` / `contacted` / `closed`).

YouTube thumbnails are derived on the fly from `youtubeVideoId` (`https://img.youtube.com/vi/{id}/mqdefault.jpg`) — no separate thumbnail storage.

## Deployment

Frontend and API deploy together as a single Cloudflare Worker — no separate static host.

- **Everything → Cloudflare Workers**: `wrangler.toml` in `artifacts/api-server`. Needs a Hyperdrive binding (`wrangler hyperdrive create ... --connection-string="<Supabase session-pooler URL>"`) pasted into `wrangler.toml`, plus `wrangler secret put` for `SESSION_SECRET`/`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`/`ADMIN_EMAILS`. Deploy with `pnpm --filter @workspace/api-server run deploy` — this builds the frontend (`artifacts/startup-review-guy/dist/public`) and then runs `wrangler deploy`, which uploads both the Worker code and the static assets in one shot. The Workers callback URL must be registered in Google Cloud Console as an authorized redirect URI.
- The `[assets]` block in `wrangler.toml` serves the built SPA directly from the Worker; `run_worker_first = ["/api/*"]` routes API paths to the Hono app before asset matching, and `not_found_handling = "single-page-application"` falls back to `index.html` for client-side routes (wouter). Everything is genuinely same-origin now, so the session cookie needs no cross-site handling.
- **Database → Supabase Postgres**: use the session-pooler connection string (`aws-0-<region>.pooler.supabase.com:5432`), not the direct `db.<ref>.supabase.co` host — the direct host is IPv6-only unless the IPv4 add-on is purchased, and most local networks are IPv4-only.

## Env vars

Required: `DATABASE_URL`, `SESSION_SECRET`. Optional (admin login): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ADMIN_EMAILS`. Local dev port overrides: `FRONTEND_PORT`, `API_PORT`. See `.env.example` for the full annotated list.
