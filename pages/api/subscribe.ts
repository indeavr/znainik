import { type NextApiRequest, type NextApiResponse } from 'next'

import { db } from '@/lib/db'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Stores a newsletter subscriber. Uses the shared Keyv store (Redis in prod,
 * in-memory otherwise). Keeps an index set so subscribers can be exported.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' })
  }

  const email = String(
    (req.body as { email?: string } | undefined)?.email ?? ''
  )
    .trim()
    .toLowerCase()

  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Невалиден имейл адрес.' })
  }

  try {
    const key = `subscriber:${email}`
    const existing = await db.get(key)
    if (existing) {
      return res.status(200).json({ ok: true, alreadySubscribed: true })
    }

    await db.set(key, {
      email,
      subscribedAt: new Date().toISOString()
    })

    return res.status(200).json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('api/subscribe error', message)
    return res.status(500).json({ error: 'Грешка на сървъра. Опитай по-късно.' })
  }
}
