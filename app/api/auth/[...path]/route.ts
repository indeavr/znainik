import { auth, isAuthConfigured } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const handlers = isAuthConfigured ? auth.handler() : null

function notConfigured() {
  return Response.json(
    {
      error: 'auth unavailable',
      hint: 'Enable Neon Auth in the Neon Console and set NEON_AUTH_BASE_URL.'
    },
    { status: 503 }
  )
}

export async function GET(req: Request) {
  if (!handlers) return notConfigured()
  return handlers.GET(req)
}

export async function POST(req: Request) {
  if (!handlers) return notConfigured()
  return handlers.POST(req)
}
