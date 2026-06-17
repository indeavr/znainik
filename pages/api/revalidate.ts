import { timingSafeEqual } from 'node:crypto'

import { type NextApiRequest, type NextApiResponse } from 'next'

import {
  collectArticlePaths,
  collectShellPaths,
  collectTagPaths,
  parseExtraPaths,
  revalidatePaths
} from '@/lib/revalidate-paths'

/**
 * On-demand revalidation for Notion content.
 *
 * Usage:
 *   GET /api/revalidate?secret=SECRET&path=all
 *     → home, tags, prikazki (+ tale pages). Fast; no full sitemap crawl.
 *     Optional: &extra=/my-article,/other-slug
 *
 *   GET /api/revalidate?secret=SECRET&path=/my-article
 *     → one article page. Use after editing a single post.
 *
 *   GET /api/revalidate?secret=SECRET&path=pages&offset=0&limit=8
 *     → batch-revalidate article pages (repeat with next offset until hasMore=false).
 *
 *   GET /api/revalidate?secret=SECRET&path=tags
 *     → all /tags/[tag] listing pages.
 *
 * Set REVALIDATE_SECRET in Vercel env.
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
  const extraParam =
    typeof req.query.extra === 'string'
      ? req.query.extra
      : (req.body?.extra as string)

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

  const mode = pathParam === 'all' || !pathParam || pathParam === '' ? 'all' : pathParam

  try {
    if (mode === 'all') {
      const paths = [
        ...(await collectShellPaths()),
        ...parseExtraPaths(extraParam)
      ]
      const results = await revalidatePaths(res, paths, 1)
      const allOk = results.every((r) => r.ok)
      return res.status(allOk ? 200 : 207).json({
        revalidated: allOk,
        mode: 'all',
        results,
        hint:
          'Revalidates paths one at a time. If you see 504, deploy with vercel.json maxDuration and retry path=/slug alone. With Deployment Protection enabled, add header x-vercel-protection-bypass.'
      })
    }

    if (mode === 'pages') {
      const offset = Math.max(0, Number(req.query.offset) || 0)
      const limit = Math.min(Math.max(1, Number(req.query.limit) || 8), 15)
      const allPaths = await collectArticlePaths()
      const batch = allPaths.slice(offset, offset + limit)
      const results = await revalidatePaths(res, batch, 1)
      const nextOffset = offset + batch.length
      const allOk = results.every((r) => r.ok)
      return res.status(allOk ? 200 : 207).json({
        revalidated: allOk,
        mode: 'pages',
        results,
        pagination: {
          offset,
          limit,
          total: allPaths.length,
          nextOffset,
          hasMore: nextOffset < allPaths.length
        }
      })
    }

    if (mode === 'tags') {
      const paths = ['/tags', ...(await collectTagPaths())]
      const results = await revalidatePaths(res, paths, 1)
      const allOk = results.every((r) => r.ok)
      return res.status(allOk ? 200 : 207).json({
        revalidated: allOk,
        mode: 'tags',
        results
      })
    }

    const path = mode.startsWith('/') ? mode : `/${mode}`
    const results = await revalidatePaths(res, [path], 1)
    const allOk = results.every((r) => r.ok)
    return res.status(allOk ? 200 : 207).json({
      revalidated: allOk,
      mode: 'single',
      results
    })
  } catch (err) {
    console.error('revalidate error', mode, err)
    return res.status(500).json({
      error: 'Revalidation failed',
      mode,
      message: err instanceof Error ? err.message : String(err)
    })
  }
}

export const config = {
  maxDuration: 60,
  api: {
    responseLimit: false,
    externalResolver: true
  }
}
