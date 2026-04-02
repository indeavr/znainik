import type { Block } from 'notion-types'

/**
 * Unwraps Notion record map entries ({ value: … }) until we reach a block with `id`.
 * Matches notion-utils `getBlockValue` (see notion-types API wrapper shape).
 */
export function getNotionBlockValue(
  node: { value?: unknown } | Block | undefined | null
): Block | undefined {
  if (node == null || typeof node !== 'object') {
    return undefined
  }
  const o = node as Record<string, unknown>
  if ('value' in o && o.value != null && typeof o.value === 'object') {
    return getNotionBlockValue(o.value as { value?: unknown } | Block)
  }
  if ('id' in o && o.id) {
    return node as Block
  }
  return undefined
}
