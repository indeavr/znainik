import { type Block, type ExtendedRecordMap } from 'notion-types'
import { getBlockTitle, getPageProperty, idToUuid } from 'notion-utils'

import { getCanonicalPageId } from './get-canonical-page-id'
import { getNotionBlockValue } from './get-notion-block-value'
import { mapImageUrl } from './map-image-url'

/** A single "Есенция" (article) distilled from the root collection. */
export interface Article {
  pageId: string
  slug: string
  title: string
  description: string
  cover: string | null
  emoji: string | null
  /** Unix epoch (ms) used for ordering; null when no date property exists. */
  date: number | null
  /** Manual sort rank from Notion; higher = closer to the top. */
  order: number | null
  tags: string[]
  featured: boolean
}

// Property name candidates (the Notion DB may use Bulgarian or English labels).
const DESCRIPTION_PROPS = ['Description', 'Описание', 'Резюме', 'Summary', 'Abstract']
const DATE_PROPS = ['Published', 'Date', 'Дата', 'Last Updated', 'Created']
const TAG_PROPS = [
  'Tags',
  'Tag',
  'Категории',
  'Категория',
  'Етикети',
  'Теми',
  'Topics',
  'Type'
]
const FEATURED_PROPS = ['Featured', 'Препоръчано', 'Избрано', 'Pinned']
const ORDER_PROPS = ['Priority', 'Order', 'Ред', 'Приоритет', 'Rank', '#']

function firstStringProperty(
  names: string[],
  block: Block,
  recordMap: ExtendedRecordMap
): string {
  for (const name of names) {
    const value = getPageProperty<string>(name, block, recordMap)
    if (value && String(value).trim()) {
      return String(value).trim()
    }
  }
  return ''
}

function firstDateProperty(
  names: string[],
  block: Block,
  recordMap: ExtendedRecordMap
): number | null {
  for (const name of names) {
    const value = getPageProperty<number>(name, block, recordMap)
    if (value) {
      return value
    }
  }
  return null
}

function parseNumericProperty(value: unknown): number | null {
  if (value == null || value === '') return null
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value.trim())
    if (!Number.isNaN(parsed)) return parsed
  }
  return null
}

function firstNumberProperty(
  names: string[],
  block: Block,
  recordMap: ExtendedRecordMap
): number | null {
  for (const name of names) {
    const value = getPageProperty<string | number>(name, block, recordMap)
    const parsed = parseNumericProperty(value)
    if (parsed != null) return parsed
  }
  return null
}

function parseTags(
  block: Block,
  recordMap: ExtendedRecordMap
): string[] {
  for (const name of TAG_PROPS) {
    const value = getPageProperty<string | string[]>(name, block, recordMap)
    if (!value) continue
    const list = Array.isArray(value) ? value : String(value).split(',')
    const tags = list
      .map((t) => String(t).trim())
      .filter((t) => t && t.toLowerCase() !== 'undefined')
    if (tags.length) {
      return [...new Set(tags)]
    }
  }
  return []
}

function isFeatured(block: Block, recordMap: ExtendedRecordMap): boolean {
  for (const name of FEATURED_PROPS) {
    const value = getPageProperty<boolean | string>(name, block, recordMap)
    if (value === true) return true
    if (typeof value === 'string' && value.toLowerCase() === 'yes') return true
  }
  return false
}

/** Newest first (default list order). */
export function compareArticlesByDate(a: Article, b: Article): number {
  return (b.date ?? 0) - (a.date ?? 0)
}

export function sortArticlesByDate(articles: Article[]): Article[] {
  return articles.toSorted(compareArticlesByDate)
}

/** Featured block only: higher `order` first, then date. */
export function compareFeaturedArticles(a: Article, b: Article): number {
  const ao = a.order
  const bo = b.order
  if (ao != null && bo != null && ao !== bo) return bo - ao
  if (ao != null && bo == null) return -1
  if (ao == null && bo != null) return 1
  return compareArticlesByDate(a, b)
}

export function sortFeaturedArticles(articles: Article[]): Article[] {
  return articles.toSorted(compareFeaturedArticles)
}

/**
 * Extracts the list of articles directly from the root page's record map.
 *
 * This intentionally reuses the single `getPage(root)` call (the gallery the
 * homepage already loads) instead of crawling the whole workspace, so it stays
 * cheap and avoids Notion rate limits.
 */
export function getArticlesFromRecordMap(
  recordMap: ExtendedRecordMap | undefined,
  rootNotionPageId: string
): Article[] {
  if (!recordMap?.block) {
    return []
  }

  const rootId = idToUuid(rootNotionPageId)
  const rootBlock = getNotionBlockValue(recordMap.block[rootId])
  const rootCollectionId =
    (rootBlock as { collection_id?: string } | undefined)?.collection_id ?? null

  const articles: Article[] = []

  for (const id of Object.keys(recordMap.block)) {
    const block = getNotionBlockValue(recordMap.block[id])
    if (!block || block.type !== 'page') continue
    if (block.parent_table !== 'collection') continue
    if (rootCollectionId && block.parent_id !== rootCollectionId) continue

    // Skip non-public pages when the database exposes a "Public" toggle.
    const isPublic = getPageProperty<boolean | null>('Public', block, recordMap)
    if (isPublic === false) continue

    const title = getBlockTitle(block, recordMap)?.trim()
    if (!title) continue

    const slug = getCanonicalPageId(block.id, recordMap, { uuid: false })
    if (!slug) continue

    const coverRaw = block.format?.page_cover
    const cover = coverRaw ? mapImageUrl(coverRaw, block) ?? null : null

    const iconRaw = block.format?.page_icon
    const emoji =
      iconRaw && !iconRaw.startsWith('http') && !iconRaw.startsWith('/')
        ? iconRaw
        : null

    articles.push({
      pageId: block.id,
      slug,
      title,
      description: firstStringProperty(DESCRIPTION_PROPS, block, recordMap),
      cover,
      emoji,
      date: firstDateProperty(DATE_PROPS, block, recordMap),
      order: firstNumberProperty(ORDER_PROPS, block, recordMap),
      tags: parseTags(block, recordMap),
      featured: isFeatured(block, recordMap)
    })
  }

  return sortArticlesByDate(articles)
}

/** Aggregates tag → count across a list of articles, sorted by frequency. */
export function getTagCounts(
  articles: Article[]
): Array<{ tag: string; count: number }> {
  const counts = new Map<string, number>()
  for (const article of articles) {
    for (const tag of article.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .toSorted((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
}

/** URL-safe slug for a tag (keeps Cyrillic readable via encodeURIComponent). */
export function tagToSlug(tag: string): string {
  return encodeURIComponent(tag.trim().toLowerCase().replaceAll(/\s+/g, '-'))
}

export function slugToTagMatcher(slug: string): (tag: string) => boolean {
  const decoded = decodeURIComponent(slug).toLowerCase()
  return (tag: string) =>
    tag.toLowerCase() === decoded ||
    tagToSlug(tag) === slug ||
    tag.toLowerCase().replaceAll(/\s+/g, '-') === decoded
}
