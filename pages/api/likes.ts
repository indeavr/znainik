import { type NextApiRequest, type NextApiResponse } from 'next'

import { normalizeEngagementPageId } from '@/lib/engagement'
import {
  getEngagementCount,
  setLikeCount
} from '@/lib/engagement-store'

/**
 * Like counter (one per device via the client).
 *
 * GET  /api/likes?id=<pageId>      -> { likes }
 * POST /api/likes  { id, liked }   -> applies delta (+1 / -1), returns { likes }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'GET') {
    const id = normalizeEngagementPageId(String(req.query.id ?? ''))
    if (!id) return res.status(400).json({ error: 'missing id' })

    try {
      const likes = await getEngagementCount('likes', id)
      return res.status(200).json({ likes })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('api/likes error', message)
      return res.status(500).json({ error: 'server error', likes: 0 })
    }
  }

  if (req.method === 'POST') {
    const body = (req.body ?? {}) as { id?: string; liked?: boolean }
    const id = normalizeEngagementPageId(String(body.id ?? ''))
    if (!id) return res.status(400).json({ error: 'missing id' })

    try {
      const likes = await setLikeCount(id, Boolean(body.liked))
      return res.status(200).json({ likes })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('api/likes error', message)
      return res.status(500).json({ error: 'server error', likes: 0 })
    }
  }

  return res.status(405).json({ error: 'method not allowed' })
}
