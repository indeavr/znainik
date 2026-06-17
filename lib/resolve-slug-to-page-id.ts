import { parsePageId } from 'notion-utils'

import {
  pageUrlAdditions,
  pageUrlOverrides,
  rootNotionPageId
} from './config'
import { getArticlesFromRecordMap } from './get-articles'
import { getCanonicalPageId } from './get-canonical-page-id'
import { getNotionBlockValue } from './get-notion-block-value'
import { getPage } from './notion'

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

  const recordMap = await getPage(rootNotionPageId)
  const articles = getArticlesFromRecordMap(recordMap, rootNotionPageId)
  const article = articles.find((entry) => entry.slug === slug)
  if (article) {
    return parsePageId(article.pageId, { uuid: false }) ?? article.pageId
  }

  for (const id of Object.keys(recordMap.block ?? {})) {
    const block = getNotionBlockValue(recordMap.block[id])
    if (!block || block.type !== 'page') continue

    const canonical = getCanonicalPageId(block.id, recordMap, { uuid: false })
    if (canonical === slug) {
      return parsePageId(block.id, { uuid: false }) ?? block.id
    }
  }

  return undefined
}
