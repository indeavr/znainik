import { createNeonAuth } from '@neondatabase/auth/next/server'

/** Neon Auth URL from Console → Branch → Auth → Configuration */
export const isAuthConfigured = Boolean(process.env.NEON_AUTH_BASE_URL)

const cookieSecret =
  process.env.NEON_AUTH_COOKIE_SECRET ??
  'dev-only-neon-auth-cookie-secret-32+'

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL ?? 'http://localhost:0',
  cookies: { secret: cookieSecret }
})
