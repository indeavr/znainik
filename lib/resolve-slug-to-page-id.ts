import { parsePageId } from 'notion-utils'

import { loadArticles } from './article-catalog'
import {
  pageUrlAdditions,
  pageUrlOverrides
} from './config'

/**
 * Resolve a public URL slug to a Notion page id with a single root-page fetch.
 * Avoids crawling the whole workspace (getSiteMap), which times out on revalidate.
 */
export async function resolveSlugToPageId(
  slug: string
): Promise<string | undefined> {
  const override = pageUrlOverrides[slug] ?? pageUrlAdditions[slug]
  if (override) {
    return parsePageId(override, { uuid: false }) ?? undefined
  }

  const articles = await loadArticles()
  const article = articles.find((entry) => entry.slug === slug)
  if (!article) return undefined
  return parsePageId(article.pageId, { uuid: false }) ?? article.pageId
}
