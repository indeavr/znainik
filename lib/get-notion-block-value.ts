import type { Block, User } from 'notion-types'

function unwrapNotionMapNode<T extends { id: string }>(
  node: { value?: unknown } | T | undefined | null
): T | undefined {
  if (node == null || typeof node !== 'object') {
    return undefined
  }
  const o = node as Record<string, unknown>
  if ('value' in o && o.value != null && typeof o.value === 'object') {
    return unwrapNotionMapNode<T>(o.value as { value?: unknown } | T)
  }
  if ('id' in o && o.id) {
    return node as T
  }
  return undefined
}

/**
 * Unwraps Notion block map entries until we reach a block with `id`.
 * Matches notion-utils `getBlockValue` (API wrapper shape).
 */
export function getNotionBlockValue(
  node: { value?: unknown } | Block | undefined | null
): Block | undefined {
  return unwrapNotionMapNode<Block>(node)
}

/** Same unboxing for `notion_user` map entries (nested `{ value: User }`). */
export function getNotionUserValue(
  node: { value?: unknown } | User | undefined | null
): User | undefined {
  return unwrapNotionMapNode<User>(node)
}
