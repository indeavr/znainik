# Guardian Circle authentication

Znainik authenticates against the same NestJS backend as Guardian Circle, Azaira
and HWA. There is no separate Znainik account or password database.

## Request flow

1. The comment form posts credentials to same-origin `/api/auth/login` or
   `/api/auth/register`.
2. The server forwards them to GC `/auth/login` or `/auth/register`, then validates
   the returned token through `/user/me`. Registration creates a shared GC account
   and uses GC's existing verification email flow; marketing consent defaults off.
3. The token stays in a host-only, HttpOnly, SameSite=Lax cookie. Production uses
   `__Host-znainik_gc` with Secure; local development uses `znainik_gc_dev`. The
   browser only receives a minimal user projection, never a bearer token.
4. `/api/auth/session` and every comment mutation validate the session with GC.
   Expired, blocked and deleted accounts lose access. A temporary backend failure
   returns a retryable error without deleting the session.
5. Logout expires only Znainik's cookie. It does not sign out other sites.

The same credentials work on all sites, but login sessions are separate. Being
logged into guardiancircle.bg does not automatically log the person into Znainik.
No token is transported in a URL or localStorage. A future automatic SSO flow
should use a dedicated, short-lived, single-use exchange, not shared parent-domain
cookies or bearer-token query parameters.

Password recovery links to GC `/forgot-password`. It resets the shared account's
password, not a Znainik-specific password.

## Environments

Server-only optional settings:

- `GC_API_URL`: defaults to `https://api.azaira.bg/api` for Vercel Production and
  `https://api-staging.azaira.bg/api` for Vercel Preview/local development.
- `GC_SITE_URL`: defaults to `https://www.guardiancircle.bg` or
  `https://test.guardiancircle.bg`, respectively, for recovery links.

A local `next build && next start` without VERCEL_ENV defaults to production;
set these explicitly when testing a local production build against staging.
No GC signing secret or backend database credentials are needed in Znainik.
`NEON_AUTH_BASE_URL` and `NEON_AUTH_COOKIE_SECRET` are no longer used.

## Comments and historical accounts

The existing Postgres `zn_comments` table remains unchanged, along with likes and
views. Neon remains the storage provider, not the authentication provider.
New comment ownership is `gc:<backend user id>`, derived only from authenticated
`/user/me`. This prefix avoids collisions with historical Neon author IDs.
Existing comments remain visible with their original author names; they are not
silently reassigned or deleted. Matching an email or name is not proof of common
ownership. Old Neon credentials cannot authenticate GC; those readers must use
or create their GC profile. Any historical ownership migration requires a
separate, verified account-linking process.

Mutations require an exact same-origin Origin header. Unknown auth paths are not
proxied. Credential requests have bounded lengths, fixed upstream paths, no
redirect following, a timeout and no-store responses.

## Validation

`pnpm typecheck`, `pnpm test:unit`, and targeted ESLint checks cover the adapter,
including CSRF, cookie isolation, identity projection, expired sessions, backend
outages and registration. Browser checks use an isolated GC fixture and mocked
comment storage to exercise login, invalid credentials, registration, reload,
comment submission/deletion, logout, and historical comments at desktop and
mobile sizes. These checks do not create accounts or comments in production.
