import { type NextApiRequest, type NextApiResponse } from 'next'

import { normalizeEngagementPageId } from '@/lib/engagement'
import { isEngagementPersisted } from '@/lib/engagement-db'
import {
  getViewCount,
  recordView
} from '@/lib/engagement-store'
import { parseVisitorId } from '@/lib/engagement-visitor'

/**
 * Page view counter (idempotent per visitor per 24h).
 *
 * GET  /api/views?id=<pageId>           -> { views, persisted }
 * POST /api/views { id, visitor }       -> { views, recorded, persisted }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' })
  }

  const rawId =
    req.method === 'POST'
      ? String((req.body as { id?: string } | undefined)?.id ?? '')
      : String(req.query.id ?? '')

  const id = normalizeEngagementPageId(rawId)
  if (!id) {
    return res.status(400).json({ error: 'missing id' })
  }

  const persisted = isEngagementPersisted

  try {
    if (req.method === 'POST') {
      const visitor = parseVisitorId(
        (req.body as { visitor?: string } | undefined)?.visitor
      )
      if (!visitor) {
        return res.status(400).json({ error: 'missing or invalid visitor' })
      }

      const result = await recordView(id, visitor)
      return res.status(200).json({ ...result, persisted })
    }

    const views = await getViewCount(id)
    return res.status(200).json({ views, persisted })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('api/views error', message)
    return res.status(500).json({ error: 'server error', views: 0, persisted })
  }
}
