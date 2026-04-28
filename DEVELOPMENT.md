# Development

This document covers local setup, required secrets, database commands,
verification, and deployment for `link.chron0.tech`.

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

### Cloudflare URL Scanner

Used to submit newly-created destination URLs for abuse review.

Create a custom Cloudflare API token with `Account > URL Scanner > Edit`, then
set:

```sh
bunx wrangler secret put CLOUDFLARE_ACCOUNT_ID
bunx wrangler secret put URL_SCANNER_API_TOKEN
```

If these are missing, new links are still created, but they are marked
`suspicious` so they can be reviewed.

### Analytics Engine SQL API

Used by owner-only analytics endpoints to query click aggregates and timeseries.
Create a custom Cloudflare API token with `Account > Account Analytics > Read`,
then set:

```sh
bunx wrangler secret put ANALYTICS_API_TOKEN
```

If this is missing, redirects still write click events, but dashboard analytics
queries return empty data.

### Admin Emails

Comma-separated list of email addresses promoted to `admin` on sign-in.

```sh
bunx wrangler secret put ADMIN_EMAILS
```

Example value:

```text
you@example.com,other-admin@example.com
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

## Development Server

Build CSS:

```sh
bun run build:css
```

Start the local Worker dev server:

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
