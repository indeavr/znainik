import { NextResponse } from 'next/server'

import { type GcSession } from './auth-types'

const productionBackend =
  process.env.VERCEL_ENV === 'production' ||
  (!process.env.VERCEL_ENV && process.env.NODE_ENV === 'production')

export const gcApiUrl = (
  process.env.GC_API_URL ??
  (productionBackend
    ? 'https://api.azaira.bg/api'
    : 'https://api-staging.azaira.bg/api')
).replace(/\/$/, '')

export const gcSiteUrl =
  process.env.GC_SITE_URL ??
  (productionBackend
    ? 'https://www.guardiancircle.bg'
    : 'https://test.guardiancircle.bg')

const secure = process.env.NODE_ENV === 'production'
export const sessionCookie = secure ? '__Host-znainik_gc' : 'znainik_gc_dev'

export class AuthError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message)
  }
}

export function privateJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', Vary: 'Cookie' }
  })
}

/** Host-only cookie: never expose the GC bearer token to browser JavaScript. */
export function withSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(sessionCookie, token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: token ? 86_400 * 30 : 0
  })
  return response
}

export function requestToken(req: Request): string | undefined {
  return req.headers
    .get('cookie')
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${sessionCookie}=`))
    ?.slice(sessionCookie.length + 1)
}

/** Also protects login/logout from cross-site form submissions. */
export function requireSameOrigin(req: Request) {
  if (req.headers.get('origin') !== new URL(req.url).origin) {
    throw new AuthError(403, 'Невалидна заявка. Презареди страницата.')
  }
}

export async function readAuthBody(req: Request) {
  if (!req.headers.get('content-type')?.startsWith('application/json')) {
    throw new AuthError(415, 'Невалиден формат.')
  }
  const text = await req.text()
  if (text.length > 8192) throw new AuthError(413, 'Заявката е твърде голяма.')
  try {
    const body: unknown = JSON.parse(text)
    if (!body || typeof body !== 'object' || Array.isArray(body))
      throw new Error('Expected a JSON object')
    return body as Record<string, unknown>
  } catch {
    throw new AuthError(400, 'Невалидна заявка.')
  }
}

export async function gcRequest(
  path: string,
  { token, body }: { token?: string; body?: unknown } = {}
) {
  let response: Response
  try {
    response = await fetch(`${gcApiUrl}${path}`, {
      method: body ? 'POST' : 'GET',
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(12_000),
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    })
  } catch {
    throw new AuthError(
      503,
      'Guardian Circle временно е недостъпен. Опитай отново.'
    )
  }
  if (!response.ok) {
    const status = [400, 401, 403, 409, 429].includes(response.status)
      ? response.status
      : 503
    throw new AuthError(
      status,
      status === 429
        ? 'Твърде много опити. Изчакай малко.'
        : status === 503
          ? 'Guardian Circle временно е недостъпен. Опитай отново.'
          : 'Провери данните си. Ако вече имаш профил в Guardian Circle, използвай Вход.'
    )
  }
  try {
    return (await response.json()) as { data: Record<string, unknown> }
  } catch {
    throw new AuthError(503, 'Guardian Circle върна невалиден отговор.')
  }
}

/** Revalidate with GC, including blocked/deleted accounts; never trust a decoded JWT. */
export async function sessionFromToken(token: string): Promise<GcSession> {
  const { data: user } = await gcRequest('/user/me', { token })
  if (!user || typeof user.id !== 'string' || typeof user.email !== 'string') {
    throw new AuthError(503, 'Guardian Circle върна невалиден профил.')
  }
  return {
    user: {
      // Separate GC identities from historical Neon IDs, even on UUID collision.
      id: `gc:${user.id}`,
      email: user.email,
      name: typeof user.name === 'string' ? user.name : '',
      image: null
    }
  }
}

export async function getSession(req: Request): Promise<GcSession | null> {
  const token = requestToken(req)
  if (!token) return null
  try {
    return await sessionFromToken(token)
  } catch (err) {
    if (err instanceof AuthError && [401, 403].includes(err.status)) return null
    throw err
  }
}

export function authErrorResponse(error: unknown) {
  return privateJson(
    {
      error:
        error instanceof AuthError
          ? error.message
          : 'Възникна грешка. Опитай отново.'
    },
    error instanceof AuthError ? error.status : 500
  )
}
