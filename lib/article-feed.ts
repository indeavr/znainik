import type { Article } from './get-articles'

let cached: { articles: Article[]; expires: number } | undefined
let pending: Promise<Article[]> | undefined

/** Search and related posts share requests, but neither caches failures. */
export async function fetchArticleFeed(): Promise<Article[]> {
  if (cached && cached.expires > Date.now()) return cached.articles
  if (pending) return pending

  pending = (async () => {
    const response = await fetch('/api/articles', {
      signal: AbortSignal.timeout(15_000)
    })
    if (!response.ok) throw new Error('Article feed unavailable')
    const data = (await response.json()) as { articles?: Article[] }
    if (!Array.isArray(data.articles)) throw new Error('Invalid article feed')
    cached = { articles: data.articles, expires: Date.now() + 30_000 }
    return data.articles
  })()
  try {
    return await pending
  } finally {
    pending = undefined
  }
}
