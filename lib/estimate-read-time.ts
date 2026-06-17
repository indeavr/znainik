import { type Block, type ExtendedRecordMap } from 'notion-types'
import { getBlockTitle, getTextContent } from 'notion-utils'

import { getNotionBlockValue } from './get-notion-block-value'

type ContentStats = {
  numWords: number
  numImages: number
}

const TEXT_BLOCK_TYPES = new Set([
  'text',
  'header',
  'sub_header',
  'sub_sub_header',
  'bulleted_list',
  'numbered_list',
  'to_do',
  'toggle',
  'callout',
  'quote',
  'alias'
])

const IMAGE_BLOCK_TYPES = new Set([
  'image',
  'embed',
  'tweet',
  'maps',
  'pdf',
  'figma',
  'typeform',
  'codepen',
  'excalidraw',
  'gist',
  'video',
  'drive',
  'audio',
  'file'
])

/** Count words in any script (Cyrillic, Latin, …). `\w` only matches ASCII. */
export function countWordsInText(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0
  const matches = trimmed.match(/[\p{L}\p{N}]+/gu)
  return matches?.length ?? 0
}

function mergeStats(a: ContentStats, b: ContentStats): void {
  a.numWords += b.numWords
  a.numImages += b.numImages
}

function getBlockContentStats(
  block: Block | undefined,
  recordMap: ExtendedRecordMap
): ContentStats {
  const stats: ContentStats = { numWords: 0, numImages: 0 }
  if (!block?.content?.length) return stats

  for (const childId of block.content) {
    const child = getNotionBlockValue(recordMap.block[childId])
    if (!child) continue

    let recurse = false

    switch (child.type) {
      case 'quote':
      case 'alias':
      case 'header':
      case 'sub_header':
      case 'sub_sub_header':
        stats.numWords += countWordsInText(getBlockTitle(child, recordMap))
        break
      
      case 'callout':
      case 'toggle':
      case 'to_do':
      case 'bulleted_list':
      case 'numbered_list':
      case 'text':
        stats.numWords += countWordsInText(getBlockTitle(child, recordMap))
        recurse = true
        break
      
      case 'code': {
        stats.numImages += 2
        const code = getTextContent(child.properties?.title)
        stats.numWords += countWordsInText(code)
        break
      }
      case 'bookmark':
        stats.numImages += 0.25
        break
      
      case 'table':
      case 'collection_view':
        stats.numImages += 2
        break
      
      case 'column':
      case 'column_list':
      case 'transclusion_container':
        recurse = true
        break
      
      case 'transclusion_reference': {
        const refId = child.format?.transclusion_reference_pointer?.id
        if (refId) {
          const refBlock = getNotionBlockValue(recordMap.block[refId])
          if (refBlock) {
            mergeStats(stats, getBlockContentStats(refBlock, recordMap))
          }
        }
        break
      }
      default:
        if (IMAGE_BLOCK_TYPES.has(child.type)) {
          stats.numImages += 1
        } else if (TEXT_BLOCK_TYPES.has(child.type)) {
          stats.numWords += countWordsInText(getBlockTitle(child, recordMap))
          recurse = true
        }
        break
      
    }

    if (recurse) {
      mergeStats(stats, getBlockContentStats(child, recordMap))
    }
  }

  return stats
}

export function estimateReadTimeMinutes(
  block: Block,
  recordMap: ExtendedRecordMap,
  {
    wordsPerMinute = 200,
    imageReadTimeInSeconds = 12
  }: {
    wordsPerMinute?: number
    imageReadTimeInSeconds?: number
  } = {}
): number {
  const stats = getBlockContentStats(block, recordMap)

  const wordMinutes = stats.numWords / wordsPerMinute
  const imageSeconds =
    stats.numImages > 10
      ? (stats.numImages / 2) * (imageReadTimeInSeconds + 3) +
        (stats.numImages - 10) * 3
      : (stats.numImages / 2) *
        (2 * imageReadTimeInSeconds + (1 - stats.numImages))
  const totalMinutes = wordMinutes + imageSeconds / 60

  if (totalMinutes <= 0) return 0
  if (totalMinutes < 1) return 1
  return Math.ceil(totalMinutes)
}
