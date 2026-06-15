import { type NextApiRequest, type NextApiResponse } from 'next'

import { db } from '@/lib/db'

function keyFor(id: string): string {
  return `views:${id.replaceAll('-', '')}`
}

/**
 * Page view counter.
 *
 * GET  /api/views?id=<pageId>  -> { views }
 * POST /api/views  { id }       -> increments and returns { views }
 *
 * Persistence relies on the shared Keyv store. In production this MUST be backed
 * by Redis (set REDIS_* env vars), otherwise counts reset per serverless call.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const id = String(
    (req.method === 'POST'
      ? (req.body as { id?: string } | undefined)?.id
      : req.query.id) ?? ''
  ).trim()

  if (!id) {
    return res.status(400).json({ error: 'missing id' })
  }

  try {
    const key = keyFor(id)

    if (req.method === 'POST') {
      const current = Number((await db.get(key)) ?? 0)
      const views = current + 1
      await db.set(key, views)
      res.setHeader('Cache-Control', 'no-store')
      return res.status(200).json({ views })
    }

    const views = Number((await db.get(key)) ?? 0)
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json({ views })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('api/views error', message)
    return res.status(500).json({ error: 'server error', views: 0 })
  }
}
