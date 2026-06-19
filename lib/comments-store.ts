import {
  type Comment,
  isValidCommentBody,
  normalizeCommentBody
} from './comments'
import { normalizeEngagementPageId } from './engagement'
import { isEngagementPersisted, sql } from './engagement-db'

let schemaReady: Promise<void> | null = null

export async function ensureCommentsSchema(): Promise<void> {
  if (!isEngagementPersisted) return
  if (!schemaReady) {
    schemaReady = initSchema()
  }
  await schemaReady
}

async function initSchema(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS zn_comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      page_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_image TEXT,
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`
    CREATE INDEX IF NOT EXISTS zn_comments_page_created_idx
    ON zn_comments (page_id, created_at DESC)
  `
}

function rowToComment(row: {
  id: string
  page_id: string
  user_id: string
  user_name: string
  user_image: string | null
  body: string
  created_at: Date | string
}): Comment {
  return {
    id: row.id,
    pageId: row.page_id,
    userId: row.user_id,
    userName: row.user_name,
    userImage: row.user_image,
    body: row.body,
    createdAt: new Date(row.created_at).toISOString()
  }
}

export async function listComments(pageIdRaw: string): Promise<Comment[]> {
  const pageId = normalizeEngagementPageId(pageIdRaw)
  if (!isEngagementPersisted) return []

  await ensureCommentsSchema()
  const { rows } = await sql<{
    id: string
    page_id: string
    user_id: string
    user_name: string
    user_image: string | null
    body: string
    created_at: Date
  }>`
    SELECT id, page_id, user_id, user_name, user_image, body, created_at
    FROM zn_comments
    WHERE page_id = ${pageId}
    ORDER BY created_at ASC
  `
  return rows.map(rowToComment)
}

export async function createComment(input: {
  pageId: string
  userId: string
  userName: string
  userImage: string | null
  body: string
}): Promise<Comment> {
  const pageId = normalizeEngagementPageId(input.pageId)
  const body = normalizeCommentBody(input.body)
  if (!isValidCommentBody(body)) {
    throw new Error('invalid body')
  }
  if (!isEngagementPersisted) {
    throw new Error('comments not configured')
  }

  await ensureCommentsSchema()
  const { rows } = await sql<{
    id: string
    page_id: string
    user_id: string
    user_name: string
    user_image: string | null
    body: string
    created_at: Date
  }>`
    INSERT INTO zn_comments (page_id, user_id, user_name, user_image, body)
    VALUES (
      ${pageId},
      ${input.userId},
      ${input.userName},
      ${input.userImage},
      ${body}
    )
    RETURNING id, page_id, user_id, user_name, user_image, body, created_at
  `
  const row = rows[0]
  if (!row) throw new Error('insert failed')
  return rowToComment(row)
}

export async function deleteComment(
  commentId: string,
  userId: string
): Promise<boolean> {
  if (!isEngagementPersisted) return false

  await ensureCommentsSchema()
  const { rowCount } = await sql`
    DELETE FROM zn_comments
    WHERE id = ${commentId} AND user_id = ${userId}
  `
  return (rowCount ?? 0) > 0
}
