import { type NextApiRequest, type NextApiResponse } from 'next'

import { rootNotionPageId } from '@/lib/config'
import { getArticlesFromRecordMap } from '@/lib/get-articles'
import { notion } from '@/lib/notion-api'
import { normalizeNotionApiRecordMap } from '@/lib/notion-record-map'
import { withNotionRetry } from '@/lib/notion-retry'

/**
 * Lightweight JSON feed of all articles ("Есенции") used by client features
 * such as the ⌘K command palette and related-posts. Derived from the single
 * root collection record map and cached aggressively at the edge.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method not allowed' })
  }

  try {
    const recordMap = await withNotionRetry(() =>
      notion.getPage(rootNotionPageId, {
        signFileUrls: false,
        concurrency: 1
      })
    )
    normalizeNotionApiRecordMap(recordMap)

    const articles = getArticlesFromRecordMap(recordMap, rootNotionPageId)

    res.setHeader(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=86400'
    )
    return res.status(200).json({ articles })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('api/articles error', message)
    return res.status(500).json({ error: 'failed to load articles', articles: [] })
  }
}
