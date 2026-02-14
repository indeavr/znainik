/**
 * Normalize a Notion UUID to a 32-char ID (no dashes).
 * Safe when uuid is undefined or null.
 */
export function safeUuidToId(uuid: string | undefined | null): string {
  return (uuid ?? '').replaceAll('-', '')
}
