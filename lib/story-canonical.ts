import { type Block, type ExtendedRecordMap } from 'notion-types'
import { getTextContent, parsePageId } from 'notion-utils'

import { getNotionBlockValue } from './get-notion-block-value'

const CANONICAL_CALLOUT_RE = /каноничн/i

function toNotionUuid(id: string): string {
  const bare = id.replaceAll('-', '')
  return parsePageId(bare, { uuid: true }) ?? id
}

function pageIdsInValue(value: unknown, excludeId: string): string[] {
  const ids: string[] = []

  const scan = (node: unknown): void => {
    if (!node) return
    if (!Array.isArray(node)) return

    if (node[0] === '‣' && Array.isArray(node[1])) {
      const pointer = node[1][0]
      if (
        Array.isArray(pointer) &&
        pointer.length > 1 &&
        pointer[0] === 'p' &&
        typeof pointer[1] === 'string'
      ) {
        const pageId = toNotionUuid(pointer[1])
        if (pageId !== excludeId) ids.push(pageId)
      }
    }

    for (const item of node) scan(item)
  }

  scan(value)
  return ids
}

function pageIdsInBlock(block: Block, excludeId: string): string[] {
  return pageIdsInValue(block.properties, excludeId)
}

function calloutText(block: Block): string {
  const props = block.properties as Record<string, unknown> | undefined
  if (!props) return ''
  return getTextContent(
    (props.title ?? props['']) as Parameters<typeof getTextContent>[0]
  )
}

function findInSubtree(
  recordMap: ExtendedRecordMap,
  blockId: string,
  excludeId: string
): string | null {
  const block = getNotionBlockValue(recordMap.block[blockId])
  if (!block) return null

  const fromBlock = pageIdsInBlock(block, excludeId)
  if (fromBlock[0]) return fromBlock[0]

  for (const childId of block.content ?? []) {
    const found = findInSubtree(recordMap, childId, excludeId)
    if (found) return found
  }
  return null
}

/**
 * If the tale page body has a callout mentioning a canonical page, return that
 * linked Notion page id (first page mention inside the callout subtree).
 */
export function findCanonicalNotionPageId(
  recordMap: ExtendedRecordMap,
  talePageId: string
): string | null {
  const excludeId = toNotionUuid(talePageId)
  const root = getNotionBlockValue(recordMap.block[excludeId])
  if (!root?.content?.length) return null

  for (const blockId of root.content) {
    const block = getNotionBlockValue(recordMap.block[blockId])
    if (!block || block.type !== 'callout') continue
    if (!CANONICAL_CALLOUT_RE.test(calloutText(block))) continue

    const fromCallout = pageIdsInBlock(block, excludeId)
    if (fromCallout[0]) return fromCallout[0]

    for (const childId of block.content ?? []) {
      const found = findInSubtree(recordMap, childId, excludeId)
      if (found) return found
    }
  }

  return null
}
