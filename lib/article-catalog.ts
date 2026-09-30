import ExpiryMap from 'expiry-map'
import pMemoize from 'p-memoize'

import { rootNotionPageId } from './config'
import { type Article, getArticlesFromRecordMap } from './get-articles'
import { notion } from './notion-api'
import { withNotionRetry } from './notion-retry'

/**
 * One fresh read of the root gallery.
 *
 * The homepage used to call `getPage(root)`, which queried every duplicate
 * view of the same database and then built LQIP previews for every image.
 * That work exceeds the serverless time limit, so on-demand revalidate and
 * the 60s ISR refresh both failed and Vercel kept serving the last good HTML.
 *
 * A 15s memo only collapses parallel reads inside one invocation (build,
 * or home + tags in the same process). It is short enough that a publish
 * followed by `/api/revalidate` still sees the new row.
 */
async function loadArticlesFresh(): Promise<Article[]> {
  const recordMap = await withNotionRetry(() =>
    notion.getPage(rootNotionPageId, {
      concurrency: 1,
      signFileUrls: false,
      fetchRelationPages: false,
      maxViewsPerCollection: 1,
      throwOnCollectionErrors: true
    })
  )

  const articles = getArticlesFromRecordMap(recordMap, rootNotionPageId)
  if (articles.length === 0) {
    throw new Error(
      'Notion article collection returned no public pages; keeping the previous page'
    )
  }

  return articles
}

export const loadArticles = pMemoize(loadArticlesFresh, {
  cache: new ExpiryMap(15_000)
})
