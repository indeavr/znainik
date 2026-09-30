import { type NextApiRequest, type NextApiResponse } from 'next'

import { loadArticles } from '@/lib/article-catalog'

/**
 * JSON feed of all articles ("Есенции") for the ⌘K palette and related posts.
 * Short edge cache so a publish shows up without waiting a day.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method not allowed' })
  }

  try {
    const articles = await loadArticles()

    res.setHeader(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=120'
    )
    return res.status(200).json({ articles })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('api/articles error', message)
    res.setHeader('Cache-Control', 'private, no-store')
    return res.status(500).json({ error: 'failed to load articles', articles: [] })
  }
}
