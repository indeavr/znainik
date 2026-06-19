export interface Comment {
  id: string
  pageId: string
  userId: string
  userName: string
  userImage: string | null
  body: string
  createdAt: string
}

export const COMMENT_MAX_LENGTH = 2000
export const COMMENT_MIN_LENGTH = 2

export function normalizeCommentBody(raw: string): string {
  return raw.trim().replaceAll(/\s+/g, ' ')
}

export function isValidCommentBody(body: string): boolean {
  const normalized = normalizeCommentBody(body)
  return (
    normalized.length >= COMMENT_MIN_LENGTH &&
    normalized.length <= COMMENT_MAX_LENGTH
  )
}
