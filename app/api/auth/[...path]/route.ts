import { auth, isAuthConfigured } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const handlers = auth.handler()

type RouteContext = { params: Promise<{ path: string[] }> }

function notConfigured() {
  console.error(
    '[znainik/auth] NEON_AUTH_BASE_URL not set — enable Auth in Neon Console'
  )
  return Response.json({ error: 'unavailable' }, { status: 503 })
}

export async function GET(req: Request, ctx: RouteContext) {
  if (!isAuthConfigured) return notConfigured()
  return handlers.GET(req, ctx)
}

export async function POST(req: Request, ctx: RouteContext) {
  if (!isAuthConfigured) return notConfigured()
  return handlers.POST(req, ctx)
}
