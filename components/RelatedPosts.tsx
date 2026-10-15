import * as React from 'react'

import type { Article } from '@/lib/get-articles'
import { ArticleCard } from '@/components/ArticleCard'
import { fetchArticleFeed } from '@/lib/article-feed'

import { ContentSkeleton } from './ContentSkeleton'

function sameId(a: string, b: string): boolean {
  return a.replaceAll('-', '') === b.replaceAll('-', '')
}

/**
 * Shows up to three related articles based on shared tags, falling back to the
 * most recent essences. Loads the cached /api/articles feed on the client.
 */
export function RelatedPosts({ pageId }: { pageId: string }) {
  const [related, setRelated] = React.useState<Article[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    setRelated([])

    async function run() {
      try {
        const articles = await fetchArticleFeed()
        if (cancelled) return

        const current = articles.find((a) => sameId(a.pageId, pageId))
        const others = articles.filter((a) => !sameId(a.pageId, pageId))
        const currentTags = new Set(current?.tags ?? [])

        const scored = others
          .map((a) => ({
            article: a,
            shared: a.tags.filter((t) => currentTags.has(t)).length
          }))
          .toSorted(
            (x, y) =>
              y.shared - x.shared ||
              (y.article.date ?? 0) - (x.article.date ?? 0)
          )

        const top = (
          scored.some((s) => s.shared > 0)
            ? scored.filter((s) => s.shared > 0)
            : scored
        )
          .slice(0, 3)
          .map((s) => s.article)

        setRelated(top)
      } catch {
        /* Keep the article readable when recommendations are unavailable. */
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [pageId])

  if (loading)
    return (
      <div className='zn-article-extras zn-related'>
        <ContentSkeleton cards />
      </div>
    )
  if (related.length === 0) return null

  return (
    <div className='zn-article-extras zn-related'>
      <h2 className='zn-related-title'>Свързани Есенции</h2>
      <div className='zn-grid'>
        {related.map((article) => (
          <ArticleCard key={article.pageId} article={article} />
        ))}
      </div>
    </div>
  )
}
