import { type Block, type ExtendedRecordMap } from 'notion-types'
import { getPageProperty, getTextContent } from 'notion-utils'

import { getNotionBlockValue } from './get-notion-block-value'
import { isoDate } from './seo'

const AUTHOR_PROPS = ['Author', 'Автор', 'Written by', 'Написал', 'Написано от']

const DATE_PROPS = ['Published', 'Date', 'Дата', 'Публикувано', 'Публикуван']

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
  const paragraphs = (block.content ?? [])
    .map((id) => getNotionBlockValue(recordMap.block[id]))
    .filter((child) => child?.type === 'text')
    .map((child) => getTextContent(child?.properties?.title))
    .filter(Boolean)
  const text = paragraphs.join(' ').replaceAll(/\s+/g, ' ').trim()
  if (!text) return undefined
  return text.length <= 180
    ? text
    : `${text.slice(0, 177).replace(/\s+\S*$/, '')}…`
}
