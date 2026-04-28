# chron0 Link Shortener

`link.chron0.tech` is a Cloudflare Workers link shortener built with Hono, D1,
KV, Analytics Engine, Better Auth, Drizzle, and a server-rendered Tailwind v4
UI.

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

Next planned phase: link creation and redirect MVP.

## Prerequisites

- Bun
- Wrangler login: `bunx wrangler login`
- Cloudflare account with the `chron0.tech` zone
- Analytics Engine enabled in Cloudflare
- Resend account and verified sending domain
- Google Cloud project for OAuth

## Install

```sh
bun install
```

## Required Secrets

Set production secrets in Cloudflare with `wrangler secret put`.

### `BETTER_AUTH_SECRET`

Used by Better Auth for signing, encryption, and hashing. Generate a strong
secret:

```sh
bunx auth@latest secret
```

or:

```sh
openssl rand -base64 32
```

Then set it:

```sh
bunx wrangler secret put BETTER_AUTH_SECRET
```

### `RESEND_API_KEY`

Used to send magic-link emails.

1. In Resend, add and verify the sending domain you want to use, such as
   `link.chron0.tech` or `chron0.tech`.
2. Add the DNS records Resend gives you.
3. Create an API key with sending access.
4. Set it:

```sh
bunx wrangler secret put RESEND_API_KEY
```

### `RESEND_FROM_EMAIL`

The sender identity for magic links. It must match a verified Resend domain.
Example:

```text
chron0 links <noreply@link.chron0.tech>
```

Set it:

```sh
bunx wrangler secret put RESEND_FROM_EMAIL
```

### Google OAuth

Create a Google OAuth Web client in Google Cloud Console.

Authorized JavaScript origin:

```text
https://link.chron0.tech
```

Authorized redirect URI:

```text
https://link.chron0.tech/api/auth/callback/google
```

Then set the credentials:

```sh
bunx wrangler secret put GOOGLE_CLIENT_ID
bunx wrangler secret put GOOGLE_CLIENT_SECRET
```

## Local Environment

Copy the example file and fill in local values:

```sh
cp .dev.vars.example .dev.vars
```

On Windows PowerShell:

```powershell
Copy-Item .dev.vars.example .dev.vars
```

## Development

Build CSS:

```sh
bun run build:css
```

Start local Worker dev server:

```sh
bun run dev
```

## Database

Generate migrations after schema changes:

```sh
bun run db:generate
```

Apply migrations locally:

```sh
bun run db:migrate:local
```

Apply migrations remotely:

```sh
bun run db:migrate:remote
```

## Verification

```sh
bun run build:css
bun run check
bun run lint
bun run test
bunx wrangler deploy --dry-run
```

## Deploy

After secrets are set:

```sh
bun run build:css
bun run deploy
```

## Cloudflare Bindings

Configured in `wrangler.jsonc`:

- `DB` - D1 database: `chron0-link-shortener`
- `LINKS_KV` - KV namespace for hot slug cache
- `ANALYTICS_ENGINE` - Analytics Engine dataset: `analytic_events`
- `ASSETS` - static asset binding
- `CREATE_LINKS_BY_IP`, `CREATE_LINKS_BY_USER`, `REPORTS_BY_IP` - rate limit
  bindings