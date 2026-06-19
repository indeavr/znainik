import { auth, isAuthConfigured } from '@/lib/auth'
import { COMMENT_MAX_LENGTH } from '@/lib/comments'
import {
  createComment,
  deleteComment,
  listComments
} from '@/lib/comments-store'
import { normalizeEngagementPageId } from '@/lib/engagement'
import { isEngagementPersisted } from '@/lib/engagement-db'

export const dynamic = 'force-dynamic'

const noStore = { 'Cache-Control': 'no-store' }

/** GET /api/comments?pageId=... — public list */
export async function GET(req: Request) {
  if (!isEngagementPersisted) {
    console.error(
      '[znainik/comments] POSTGRES_URL not set — comments disabled locally'
    )
    return Response.json({ comments: [] }, { headers: noStore })
  }

  const pageId = normalizeEngagementPageId(
    new URL(req.url).searchParams.get('pageId') ?? ''
  )
  if (!pageId) {
    return Response.json({ error: 'missing pageId' }, { status: 400 })
  }

  try {
    const comments = await listComments(pageId)
    return Response.json({ comments }, { headers: noStore })
  } catch (err: unknown) {
    console.error('comments list error', err)
    return Response.json(
      { error: 'server error', comments: [] },
      { status: 500, headers: noStore }
    )
  }
}

/** POST /api/comments { pageId, body } — logged-in only */
export async function POST(req: Request) {
  if (!isEngagementPersisted || !isAuthConfigured) {
    console.error(
      '[znainik/comments] POST blocked — set POSTGRES_URL, NEON_AUTH_BASE_URL, NEON_AUTH_COOKIE_SECRET'
    )
    return Response.json({ error: 'unavailable' }, { status: 503 })
  }

  const { data: session } = await auth.getSession()
  if (!session?.user) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = (await req.json()) as {
    pageId?: string
    text?: string
    body?: string
  }
  const pageId = normalizeEngagementPageId(String(body.pageId ?? ''))
  const text = String(body.body ?? body.text ?? '')

  if (!pageId) {
    return Response.json({ error: 'missing pageId' }, { status: 400 })
  }
  if (!text.trim()) {
    return Response.json({ error: 'empty comment' }, { status: 400 })
  }
  if (text.length > COMMENT_MAX_LENGTH) {
    return Response.json({ error: 'comment too long' }, { status: 400 })
  }

  try {
    const comment = await createComment({
      pageId,
      userId: session.user.id,
      userName:
        session.user.name || session.user.email?.split('@')[0] || 'Читател',
      userImage: session.user.image ?? null,
      body: text
    })
    return Response.json({ comment }, { status: 201, headers: noStore })
  } catch (err: unknown) {
    console.error('comments create error', err)
    return Response.json({ error: 'server error' }, { status: 500 })
  }
}

/** DELETE /api/comments?id=... — own comment only */
export async function DELETE(req: Request) {
  if (!isEngagementPersisted || !isAuthConfigured) {
    console.error(
      '[znainik/comments] DELETE blocked — set POSTGRES_URL, NEON_AUTH_BASE_URL, NEON_AUTH_COOKIE_SECRET'
    )
    return Response.json({ error: 'unavailable' }, { status: 503 })
  }

  const { data: session } = await auth.getSession()
  if (!session?.user) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const id = new URL(req.url).searchParams.get('id') ?? ''
  if (!id) {
    return Response.json({ error: 'missing id' }, { status: 400 })
  }

  try {
    const ok = await deleteComment(id, session.user.id)
    if (!ok) return Response.json({ error: 'not found' }, { status: 404 })
    return Response.json({ deleted: true }, { headers: noStore })
  } catch (err: unknown) {
    console.error('comments delete error', err)
    return Response.json({ error: 'server error' }, { status: 500 })
  }
}
