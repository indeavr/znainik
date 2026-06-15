import { type NextApiRequest, type NextApiResponse } from 'next'

import { db } from '@/lib/db'

function keyFor(id: string): string {
  return `likes:${id.replaceAll('-', '')}`
}

/**
 * Like counter (Medium-style clap, capped at one per device via the client).
 *
 * GET  /api/likes?id=<pageId>      -> { likes }
 * POST /api/likes  { id, liked }   -> applies delta (+1 / -1), returns { likes }
 *
 * Like views, this needs a Redis-backed Keyv store in production to persist.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    const id = String(req.query.id ?? '').trim()
    if (!id) return res.status(400).json({ error: 'missing id' })
    try {
      const likes = Number((await db.get(keyFor(id))) ?? 0)
      res.setHeader('Cache-Control', 'no-store')
      return res.status(200).json({ likes })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('api/likes error', message)
      return res.status(500).json({ error: 'server error', likes: 0 })
    }
  }

  if (req.method === 'POST') {
    const body = (req.body ?? {}) as { id?: string; liked?: boolean }
    const id = String(body.id ?? '').trim()
    if (!id) return res.status(400).json({ error: 'missing id' })

    try {
      const key = keyFor(id)
      const current = Number((await db.get(key)) ?? 0)
      const likes = Math.max(0, current + (body.liked ? 1 : -1))
      await db.set(key, likes)
      res.setHeader('Cache-Control', 'no-store')
      return res.status(200).json({ likes })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('api/likes error', message)
      return res.status(500).json({ error: 'server error', likes: 0 })
    }
  }

  return res.status(405).json({ error: 'method not allowed' })
}
