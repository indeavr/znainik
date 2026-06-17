import { type NextApiRequest, type NextApiResponse } from 'next'

import { normalizeEngagementPageId } from '@/lib/engagement'
import {
  getEngagementCount,
  incrementViewCount
} from '@/lib/engagement-store'

/**
 * Page view counter.
 *
 * GET  /api/views?id=<pageId>  -> { views }
 * POST /api/views  { id }       -> increments and returns { views }
 *
 * Persistence relies on the shared Keyv store (Redis in production).
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

  try {
    if (req.method === 'POST') {
      const views = await incrementViewCount(id)
      return res.status(200).json({ views })
    }

    const views = await getEngagementCount('views', id)
    return res.status(200).json({ views })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('api/views error', message)
    return res.status(500).json({ error: 'server error', views: 0 })
  }
}
