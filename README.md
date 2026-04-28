# chron0 Link Shortener

`link.chron0.tech` is a Cloudflare Workers link shortener built with Hono, D1,
KV, Analytics Engine, Better Auth, Drizzle, and a server-rendered Tailwind v4
UI.

<img width="1370" height="895" alt="image" src="https://github.com/user-attachments/assets/2fcbfd5b-26ab-44a7-9147-647980c1665e" />


## Goal

The project is a single Worker that handles the public landing page, auth,
dashboard, link creation, redirects, abuse reporting, admin review, and
analytics. D1 is the source of truth, KV is the redirect hot-path cache, and
Analytics Engine stores click events.

## Status

Implemented:

- Worker scaffold with Hono routes and static assets.
- D1, KV, Analytics Engine, assets, rate limit, and cron bindings.
- Drizzle schema and D1 migrations for users, sessions, accounts,
  verifications, links, and link reports.
- Better Auth with magic-link auth, optional Google OAuth, and D1-backed
  sessions.
- Server-rendered landing page, auth pages, dashboard shell, and cookie-backed
  light/dark theme.
- Link slug validation, authenticated link creation API, D1/KV write-through,
  and anonymous redirect handling with not-found, disabled, and expired pages.

Next planned phase: abuse controls.

## Architecture

- Hono composes the Worker routes.
- Drizzle defines the D1 schema and migrations.
- Better Auth stores users, sessions, accounts, and verifications in D1.
- Resend sends magic-link emails.
- Tailwind v4 builds a static stylesheet served through Workers Assets.
- Theme preference is stored in an HTTP-only cookie so SSR can render without a
  flash.

## Cloudflare Bindings

Configured in `wrangler.jsonc`:

- `DB` - D1 database: `chron0-link-shortener`
- `LINKS_KV` - KV namespace for hot slug cache
- `ANALYTICS_ENGINE` - Analytics Engine dataset: `analytic_events`
- `ASSETS` - static asset binding
- `CREATE_LINKS_BY_IP`, `CREATE_LINKS_BY_USER`, `REPORTS_BY_IP` - rate limit
  bindings

## Development Runbook

Install, local development, secrets, database, verification, and deploy
instructions live in [DEVELOPMENT.md](./DEVELOPMENT.md).
