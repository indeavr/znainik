import * as React from 'react'

import type { Article } from '@/lib/get-articles'
import { ArticleCard } from '@/components/ArticleCard'
import { fetchArticleFeed } from '@/lib/article-feed'
import { selectRelatedArticles } from '@/lib/related-articles'

import { ContentSkeleton } from './ContentSkeleton'

/** Server-rendered recommendations; client fallback when the catalog is unavailable. */
export function RelatedPosts({
  pageId,
  articles
}: {
  pageId: string
  articles?: Article[]
}) {
  const [related, setRelated] = React.useState<Article[]>([])
  const [loading, setLoading] = React.useState(!articles)

  React.useEffect(() => {
    if (articles) return
    let cancelled = false
    setLoading(true)
    setRelated([])

    async function run() {
      try {
        const articles = await fetchArticleFeed()
        if (cancelled) return

        setRelated(selectRelatedArticles(articles, pageId))
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
  }, [pageId, articles])

  const recommendations = articles ?? related

  if (!articles && loading)
    return (
      <div className='zn-article-extras zn-related'>
        <ContentSkeleton cards />
      </div>
    )
  if (recommendations.length === 0) return null

  return (
    <div className='zn-article-extras zn-related'>
      <h2 className='zn-related-title'>Свързани Есенции</h2>
      <div className='zn-grid'>
        {recommendations.map((article) => (
          <ArticleCard key={article.pageId} article={article} />
        ))}
      </div>
    </div>
  )
}
