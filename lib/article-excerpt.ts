import { type Block, type ExtendedRecordMap } from 'notion-types'
import { getTextContent } from 'notion-utils'

import { getNotionBlockValue } from './get-notion-block-value'

const textTypes = new Set([
  'text',
  'quote',
  'callout',
  'bulleted_list',
  'numbered_list'
])
const containers = new Set(['column_list', 'column', 'toggle', ...textTypes])
export const EXCERPT_LENGTH = 240

/** Only the opening body: never child pages, database rows, embeds or image captions. */
export function articleOpening(block: Block, recordMap: ExtendedRecordMap) {
  const paragraphs: string[] = []
  const missing: string[] = []
  const visited = new Set<string>()
  let incomplete = false
  function visit(ids: string[], depth: number) {
    if (depth > 4) return
    for (const id of ids.slice(0, 24)) {
      if (visited.size >= 64 || paragraphs.join(' ').length >= EXCERPT_LENGTH)
        break
      if (visited.has(id)) continue
      visited.add(id)
      const child = getNotionBlockValue(recordMap.block[id])
      if (!child) {
        missing.push(id)
        incomplete = true
        continue
      }
      if (!incomplete && textTypes.has(child.type)) {
        const text = getTextContent(child.properties?.title)
          .replaceAll(/\s+/g, ' ')
          .trim()
        if (text && !/^https?:\/\/\S+$/.test(text)) paragraphs.push(text)
      }
      if (containers.has(child.type)) visit(child.content ?? [], depth + 1)
    }
  }
  visit(block.content ?? [], 0)
  const text = paragraphs.join(' ')
  const excerpt =
    text.length <= EXCERPT_LENGTH
      ? text
      : `${text
          .slice(0, EXCERPT_LENGTH - 1)
          .replace(/\s+\S*$/, '')
          .trimEnd()}…`
  return { excerpt, missing }
}
