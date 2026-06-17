/** 32-char Notion page id (no dashes) — stable key for Redis + browser storage. */
export function normalizeEngagementPageId(id: string): string {
  return id.trim().replaceAll('-', '')
}

export function engagementDbKey(
  kind: 'views' | 'likes',
  pageId: string
): string {
  return `${kind}:${normalizeEngagementPageId(pageId)}`
}

export function engagementClientKey(
  kind: 'viewed' | 'liked',
  pageId: string
): string {
  return `${kind}:${normalizeEngagementPageId(pageId)}`
}
