import { type Block, type ExtendedRecordMap } from 'notion-types'
import { getPageProperty } from 'notion-utils'

import { articleOpening } from './article-excerpt'
import { isoDate } from './seo'

const AUTHOR_PROPS = ['Author', 'Автор', 'Written by', 'Написал', 'Написано от']

const DATE_PROPS = ['Published', 'Date', 'Дата', 'Публикувано', 'Публикуван']

/** Optional editorial SEO fields do not change the article heading or card text. */
export function getPageSeoText(
  block: Block,
  recordMap: ExtendedRecordMap,
  field: 'title' | 'description'
): string | undefined {
  const names =
    field === 'title'
      ? ['SEO Title', 'SEO заглавие']
      : ['SEO Description', 'SEO описание']
  for (const name of names) {
    const value = getPageProperty<string>(name, block, recordMap)
    if (value && String(value).trim())
      return String(value).replaceAll(/\s+/g, ' ').trim()
  }
  return undefined
}

export function getPageAuthorName(
  block: Block,
  recordMap: ExtendedRecordMap
): string | undefined {
  for (const name of AUTHOR_PROPS) {
    const value = getPageProperty<string>(name, block, recordMap)
    if (value && String(value).trim()) {
      return String(value).trim()
    }
  }
  return undefined
}

export function getPagePublishedTimestamp(
  block: Block,
  recordMap: ExtendedRecordMap
): number | null {
  for (const name of DATE_PROPS) {
    const value = getPageProperty<number>(name, block, recordMap)
    if (isoDate(value)) return value
  }
  return null
}

export function formatBulgarianDate(ts: number): string | null {
  try {
    return new Intl.DateTimeFormat('bg-BG', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(ts))
  } catch {
    return null
  }
}

/** Prefer editorial descriptions, otherwise use the first real body paragraphs. */
export function getPageDescription(
  block: Block,
  recordMap: ExtendedRecordMap
): string | undefined {
  for (const name of [
    'Description',
    'Описание',
    'Резюме',
    'Summary',
    'Abstract'
  ]) {
    const value = getPageProperty<string>(name, block, recordMap)
    if (value && String(value).trim())
      return String(value).trim().replaceAll(/\s+/g, ' ')
  }
  const opening = articleOpening(block, recordMap)
  return opening.missing.length ? undefined : opening.excerpt || undefined
}
