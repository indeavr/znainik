import ExpiryMap from 'expiry-map'
import { type ExtendedRecordMap } from 'notion-types'

import { articleOpening } from './article-excerpt'
import { type Article } from './get-articles'
import { getNotionBlockValue } from './get-notion-block-value'

const excerpts = new ExpiryMap<string, string>(300_000)

/** Batch opening blocks, not full pages. Cached text is keyed by the live revision. */
export async function withArticleExcerpts(
  articles: Article[],
  recordMap: ExtendedRecordMap,
  readBlocks: (ids: string[]) => Promise<ExtendedRecordMap['block']>
): Promise<Article[]> {
  const key = (article: Article) =>
    `${article.pageId}:${article.modified ?? ''}`
  const missing = articles.filter(
    (article) => !article.description.trim() && !excerpts.has(key(article))
  )
  const opening = (article: Article) => {
    const block = getNotionBlockValue(recordMap.block[article.pageId])
    return block
      ? articleOpening(block, recordMap)
      : { excerpt: '', missing: [] }
  }
  const attempted = new Set<string>()
  // Four levels cover ordinary columns and lists without crawling linked pages.
  for (let depth = 0; depth < 5; depth++) {
    const ids = [
      ...new Set(missing.flatMap((article) => opening(article).missing))
    ].filter((id) => !attempted.has(id))
    if (!ids.length) break
    for (let offset = 0; offset < ids.length; offset += 100) {
      const batch = ids.slice(offset, offset + 100)
      for (const id of batch) attempted.add(id)
      recordMap.block = { ...recordMap.block, ...(await readBlocks(batch)) }
    }
  }
  for (const article of missing)
    excerpts.set(key(article), opening(article).excerpt)
  return articles.map((article) =>
    article.description.trim()
      ? article
      : {
          ...article,
          description: excerpts.get(key(article)) ?? ''
        }
  )
}
