import { timingSafeEqual } from 'node:crypto'

import { type NextApiRequest, type NextApiResponse } from 'next'

import { pageUrlOverrides } from '@/lib/config'
import { getSiteMap } from '@/lib/get-site-map'

/**
 * On-demand revalidation for Notion content.
 * Call this after editing a page in Notion so production serves the latest content
 * without redeploying.
 *
 * Usage:
 *   POST/GET /api/revalidate?secret=YOUR_SECRET&path=/oracle
 *   POST/GET /api/revalidate?secret=YOUR_SECRET&path=all   (revalidate home + all known paths)
 *
 * Set REVALIDATE_SECRET in Vercel env (e.g. a long random string).
 * Optionally call from a Notion webhook or cron.
 */
export default async function revalidate(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0')

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const secret =
    typeof req.query.secret === 'string'
      ? req.query.secret
      : (req.body?.secret as string)
  const pathParam =
    typeof req.query.path === 'string'
      ? req.query.path
      : (req.body?.path as string)

  if (!process.env.REVALIDATE_SECRET) {
    console.warn('REVALIDATE_SECRET is not set; revalidate API is disabled')
    return res.status(503).json({
      error: 'Revalidation not configured',
      hint: 'Set REVALIDATE_SECRET in Vercel environment variables'
    })
  }

  const expected = process.env.REVALIDATE_SECRET ?? ''
  const secretStr = typeof secret === 'string' ? secret : ''
  if (
    secretStr.length !== expected.length ||
    !timingSafeEqual(
      Buffer.from(secretStr, 'utf8'),
      Buffer.from(expected, 'utf8')
    )
  ) {
    return res.status(401).json({ error: 'Invalid secret' })
  }

  const pathsToRevalidate: string[] = []

  if (pathParam === 'all' || !pathParam || pathParam === '') {
    pathsToRevalidate.push('/')
    // Static routes that fetch Notion (e.g. pages/oracle/index.tsx)
    pathsToRevalidate.push('/oracle')
    try {
      const siteMap = await getSiteMap()
      const canonicalPaths = Object.keys(siteMap.canonicalPageMap).map(
        (slug) => `/${slug}`
      )
      const overridePaths = Object.keys(pageUrlOverrides).map(
        (slug) => `/${slug}`
      )
      pathsToRevalidate.push(
        ...canonicalPaths,
        ...overridePaths.filter((p) => !pathsToRevalidate.includes(p))
      )
    } catch (err) {
      console.error('revalidate getSiteMap', err)
      return res.status(500).json({
        error: 'Failed to get paths for revalidate all',
        message: err instanceof Error ? err.message : String(err)
      })
    }
  } else {
    const path = pathParam.startsWith('/') ? pathParam : `/${pathParam}`
    pathsToRevalidate.push(path)
  }

  const results: { path: string; ok: boolean; error?: string }[] = []

  for (const path of pathsToRevalidate) {
    try {
      await res.revalidate(path)
      results.push({ path, ok: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('revalidate path', path, message)
      results.push({ path, ok: false, error: message })
    }
  }

  const allOk = results.every((r) => r.ok)
  return res.status(allOk ? 200 : 207).json({
    revalidated: allOk,
    results
  })
}
