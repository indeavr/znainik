/** 32-char Notion page id (no dashes) — stable key for engagement rows. */
export function normalizeEngagementPageId(id: string): string {
  return id.trim().replaceAll('-', '')
}
