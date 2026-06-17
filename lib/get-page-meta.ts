import { type Block, type ExtendedRecordMap } from 'notion-types'
import { getPageProperty } from 'notion-utils'

const AUTHOR_PROPS = ['Author', 'Автор', 'Written by', 'Написал', 'Написано от']

const DATE_PROPS = [
  'Published',
  'Date',
  'Дата',
  'Last Updated',
  'Публикувано',
  'Публикуван'
]

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
    if (value) return value
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
