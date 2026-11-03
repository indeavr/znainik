import {
  AuthError,
  authErrorResponse,
  gcRequest,
  gcSiteUrl,
  getSession,
  privateJson,
  readAuthBody,
  requestToken,
  requireSameOrigin,
  sessionFromToken,
  withSessionCookie
} from '@/lib/auth'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ path: string[] }> }

export async function GET(req: Request, ctx: RouteContext) {
  const { path } = await ctx.params
  if (path.join('/') === 'recovery') {
    return Response.redirect(new URL('/forgot-password', gcSiteUrl))
  }
  if (path.join('/') !== 'session')
    return privateJson({ error: 'not found' }, 404)
  try {
    const session = await getSession(req)
    const response = privateJson({ session })
    return !session && requestToken(req)
      ? withSessionCookie(response, '')
      : response
  } catch (err) {
    return authErrorResponse(err)
  }
}

export async function POST(req: Request, ctx: RouteContext) {
  try {
    requireSameOrigin(req)
    const { path } = await ctx.params
    const action = path.join('/')
    if (action === 'logout') {
      return withSessionCookie(privateJson({ success: true }), '')
    }
    if (action !== 'login' && action !== 'register') {
      return privateJson({ error: 'not found' }, 404)
    }

    const body = await readAuthBody(req)
    const email =
      typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 254 ||
      !password ||
      password.length > 128 ||
      (action === 'register' && (password.length < 8 || name.length > 100))
    ) {
      throw new AuthError(
        400,
        'Провери имейла и паролата си. За регистрация са нужни поне 8 символа.'
      )
    }
    const result = await gcRequest(`/auth/${action}`, {
      body: {
        email,
        password,
        ...(action === 'register' ? { name, marketingOptIn: false } : {})
      }
    })
    const token = result.data?.token
    if (typeof token !== 'string' || !/^[\w.-]+$/.test(token)) {
      throw new AuthError(503, 'Входът временно е недостъпен.')
    }
    const session = await sessionFromToken(token)
    return withSessionCookie(privateJson({ session }), token)
  } catch (err) {
    return authErrorResponse(err)
  }
}
