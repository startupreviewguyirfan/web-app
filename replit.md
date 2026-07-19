# Startup Review Guy

Irfan's personal brand site and startup showcase — a YouTube channel where he reviews new startups daily, with a built-in partnership lead gen flow and admin panel.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, served at /api)
- `pnpm --filter @workspace/startup-review-guy run dev` — run the frontend (served at /)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `SESSION_SECRET` — secret for express-session
- Optional env: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — for Google OAuth admin login
- Optional env: `ADMIN_EMAILS` — comma-separated list of allowed admin emails

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + wouter routing
- API: Express 5 (artifacts/api-server)
- DB: PostgreSQL + Drizzle ORM
- Auth: Passport.js + Google OAuth 2.0 (admin-only, allow-list via ADMIN_EMAILS env)
- Sessions: express-session + connect-pg-simple (stored in Postgres)
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec in lib/api-spec/openapi.yaml)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for API contracts
- `lib/db/src/schema/` — Drizzle table definitions (startups, founders, partner_inquiries)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/middlewares/require-admin.ts` — admin auth guard
- `artifacts/startup-review-guy/src/` — React frontend

## Pages

- `/` — Landing page: Irfan's personal brand hero, featured startups, stats
- `/startups` — Startup listing with search/filter/pagination
- `/startups/:slug` — Individual startup detail (SEO-optimized)
- `/partner` — Partnership contact form
- `/admin-access` — Admin panel (Google OAuth, allow-list protected)

## Auth flow

1. Admin clicks "Sign in with Google" → hits `/api/auth/google`
2. Google redirects back to `/api/auth/google/callback`
3. Passport checks the email against `ADMIN_EMAILS` env var
4. On success → redirects to `/admin-access`; on failure → redirects to `/?auth=failed`

## Architecture decisions

- Auth is session-based (express-session + connect-pg-simple), not JWT. Simpler for a single-admin use case.
- Sessions stored in Postgres to survive server restarts.
- Admin allow-list is env-var driven (ADMIN_EMAILS), not a DB table — keeps admin setup zero-config.
- Startup slugs are the canonical URL identifier for SEO pages.
- YouTube thumbnails derived from youtubeVideoId at `https://img.youtube.com/vi/{id}/mqdefault.jpg` — no extra storage needed.

## Product

- Public site showcases all reviewed startups with SEO-optimized individual pages
- Partnership page converts startup founders into paid review clients
- Admin panel lets Irfan add/edit/delete startups and manage incoming partnership inquiries

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Google OAuth won't work until GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and ADMIN_EMAILS are set in environment secrets.
- The OAuth callback URL is `/api/auth/google/callback` — register this exact URL in Google Cloud Console.
- After any schema change, run `pnpm --filter @workspace/db run push` then restart the API server.
- After any OpenAPI spec change, run codegen before restarting anything.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
