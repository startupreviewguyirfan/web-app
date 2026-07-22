# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Product

Startup Review Guy is the website for a YouTube channel run by Irfan (developer in Toronto, 10+ years building/scaling web apps) who reviews new startups daily. The site has two goals, in priority order:

1. Showcase every reviewed startup with its own SEO-optimized page (e.g. `/startups/claude-ai-agent`).
2. Generate partnership leads — startups reaching out to sponsor a paid review via `/partner`.

There's also a lightweight admin panel (`/admin-access`, Google sign-in via Supabase Auth, allow-listed emails) for Irfan to manage startup entries and incoming partnership inquiries.

**Note on origin:** the original product brief (kept at `attached_assets/Pasted-Project-Overview-*.txt`) specified Next.js + Prisma + NextAuth + Vercel. The project was rebuilt as a pnpm-workspace monorepo instead — React/Vite frontend and a Hono API both deployed to a single Cloudflare Worker (`artifacts/api-server`, static assets + `/api/*`), Supabase Postgres via Drizzle, and Supabase Auth for Google sign-in — because Vercel wasn't used for hosting and Node-only auth libraries don't run on Workers. The product requirements (pages, data model, SEO goals) from that original brief still apply; only the implementation stack differs. Treat the brief as historical context, not as a guide to current architecture.

## Pages

- `/` — Landing page: Irfan's personal brand hero, featured startups, stats
- `/startups` — Startup listing with search/filter/pagination
- `/startups/:slug` — Individual startup detail (SEO-optimized)
- `/partner` — Partnership contact form
- `/admin-access` — Admin panel (Supabase Auth Google sign-in, allow-list protected)

## Commands

- `cp .env.example .env` then fill in `DATABASE_URL` (Supabase session-pooler string) — required before anything runs.
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
- `src/lib/supabase.ts` — `getSupabaseUser(c, token)`, verifies a bearer token by calling Supabase's Auth REST API directly (`GET /auth/v1/user`) with plain `fetch` rather than the `@supabase/supabase-js` client — that client eagerly constructs a Realtime (WebSocket) client on instantiation, which throws on Node < 22 (no global `WebSocket`), and we never need realtime/Postgrest/Storage here, only token verification. `supabase-js` is still used client-side (browsers have `WebSocket` natively).
- `src/lib/auth-user.ts` — `getAdminUser(c)`: pulls the `Authorization: Bearer <token>` header, verifies it against Supabase, then checks the returned email against `ADMIN_EMAILS`. Returns `null` if the token is missing/invalid or the email isn't allow-listed — there is no server-side session, this runs on every request that needs it.
- `src/middlewares/require-admin.ts` — guards `/admin/*` routes by calling `getAdminUser`.
- `src/routes/` — `health.ts`, `auth.ts` (`GET /auth/session` — reports whether the caller's bearer token belongs to an allow-listed admin), `startups.ts` (public), `partner.ts` (public inquiry submission), `admin.ts` (CRUD for startups + founders, inquiry status updates; all behind `requireAdmin`).

**Auth flow** (Supabase Auth, not hand-rolled OAuth or Passport/NextAuth — those rely on Node-only APIs that don't run on Workers, and Supabase Auth's client SDK is fetch-based):
1. Google is configured as a provider in the Supabase project's Auth settings (dashboard) — this repo doesn't hold Google client secrets anymore.
2. Frontend (`src/lib/supabase.ts`) calls `supabase.auth.signInWithOAuth({ provider: "google" })`; Supabase's hosted GoTrue service handles the entire Google redirect/callback and returns a session directly to the browser (client-side flow, no server involvement).
3. `App.tsx` registers the Supabase access token with the generated API client (`setAuthTokenGetter`, from `lib/api-client-react/src/custom-fetch.ts`) so every request to `/api/*` carries `Authorization: Bearer <token>`, and syncs `supabase.auth.onAuthStateChange` to the `getSession` query cache so the UI reacts to sign-in/out immediately.
4. Server-side, `getAdminUser` (`src/lib/auth-user.ts`) verifies that token against Supabase and checks the email against `ADMIN_EMAILS` (comma-separated allow-list — Supabase Auth has no roles table, any Google account can sign in, so this allow-list is what actually gates admin access) on every request — there's no server session cookie or JWT of this app's own.

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

- **Everything → Cloudflare Workers**: `wrangler.toml` in `artifacts/api-server`. Needs a Hyperdrive binding (`wrangler hyperdrive create ... --connection-string="<Supabase session-pooler URL>"`) pasted into `wrangler.toml`, plus `wrangler secret put` for `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY`/`ADMIN_EMAILS`. `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY` must also be set in the shell that runs the deploy — Vite bakes them into the built frontend at build time, the Worker doesn't read them at runtime. Deploy with `pnpm --filter @workspace/api-server run deploy` — this builds the frontend (`artifacts/startup-review-guy/dist/public`) and then runs `wrangler deploy`, which uploads both the Worker code and the static assets in one shot. The deployed origin's callback URL must be registered in the Supabase project's Auth settings (Redirect URLs) and in Google Cloud Console as an authorized redirect URI for the Supabase provider.
- The `[assets]` block in `wrangler.toml` serves the built SPA directly from the Worker; `run_worker_first = ["/api/*"]` routes API paths to the Hono app before asset matching, and `not_found_handling = "single-page-application"` falls back to `index.html` for client-side routes (wouter). Auth is bearer-token based (no cookies), so same-origin vs. cross-site is not a concern here.
- **Database → Supabase Postgres**: use the session-pooler connection string (`aws-0-<region>.pooler.supabase.com:5432`), not the direct `db.<ref>.supabase.co` host — the direct host is IPv6-only unless the IPv4 add-on is purchased, and most local networks are IPv4-only.

## Env vars

Required: `DATABASE_URL`. Optional (admin login): `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (frontend needs its own `VITE_`-prefixed copies — Vite only exposes `VITE_`-prefixed vars to client code), `ADMIN_EMAILS`. Local dev port overrides: `FRONTEND_PORT`, `API_PORT`. See `.env.example` for the full annotated list.
