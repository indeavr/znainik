/**
 * Safe UUID → ID conversion. notion-utils' uuidToId uses .replaceAll() and
 * throws if given undefined. Use this everywhere we need to compare or
 * normalize page IDs so we never pass undefined to notion-utils.
 */
export function safeUuidToId(uuid: string | undefined | null): string {
  return (uuid ?? '').replace(/-/g, '')
}
