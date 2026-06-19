import { type NextApiRequest, type NextApiResponse } from 'next'

import { normalizeEngagementPageId } from '@/lib/engagement'
import { isEngagementPersisted } from '@/lib/engagement-db'
import { addVisitorLike, getLikeState } from '@/lib/engagement-store'
import { parseVisitorId } from '@/lib/engagement-visitor'

/**
 * Like counter — up to 13 claps per visitor (no unlike).
 *
 * GET  /api/likes?id=<pageId>&visitor=<uuid>  -> { likes, userLikes, maxLikes, persisted }
 * POST /api/likes { id, visitor }               -> adds one clap if under max
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader('Cache-Control', 'no-store')

  const persisted = isEngagementPersisted

  if (req.method === 'GET') {
    const id = normalizeEngagementPageId(String(req.query.id ?? ''))
    if (!id) return res.status(400).json({ error: 'missing id' })

    const visitor = parseVisitorId(req.query.visitor)

    try {
      const state = await getLikeState(id, visitor)
      return res.status(200).json({ ...state, persisted })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('api/likes error', message)
      return res.status(500).json({
        error: 'server error',
        likes: 0,
        userLikes: 0,
        maxLikes: 13,
        persisted
      })
    }
  }

  if (req.method === 'POST') {
    const body = (req.body ?? {}) as { id?: string; visitor?: string }
    const id = normalizeEngagementPageId(String(body.id ?? ''))
    if (!id) return res.status(400).json({ error: 'missing id' })

    const visitor = parseVisitorId(body.visitor)
    if (!visitor) {
      return res.status(400).json({ error: 'missing or invalid visitor' })
    }

    try {
      const state = await addVisitorLike(id, visitor)
      return res.status(200).json({ ...state, persisted })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('api/likes error', message)
      return res.status(500).json({
        error: 'server error',
        likes: 0,
        userLikes: 0,
        maxLikes: 13,
        persisted
      })
    }
  }

  return res.status(405).json({ error: 'method not allowed' })
}
