import { normalizeEngagementPageId } from './engagement'
import { MAX_LIKES_PER_VISITOR, VIEW_DEDUP_TTL_MS } from './engagement-constants'
import { ensureEngagementSchema, isEngagementPersisted, sql } from './engagement-db'
import * as memory from './engagement-memory'
import { isValidVisitorId } from './engagement-visitor'

function pageId(pageIdRaw: string): string {
  return normalizeEngagementPageId(pageIdRaw)
}

export type LikeState = {
  likes: number
  userLikes: number
  maxLikes: number
}

export async function getViewCount(pageIdRaw: string): Promise<number> {
  const id = pageId(pageIdRaw)
  if (!isEngagementPersisted) return memory.memoryGetViewCount(id)

  await ensureEngagementSchema()
  const { rows } = await sql<{ views: number }>`
    SELECT views FROM zn_page_totals WHERE page_id = ${id}
  `
  return rows[0]?.views ?? 0
}

export async function getLikeState(
  pageIdRaw: string,
  visitorId: string | null
): Promise<LikeState> {
  const id = pageId(pageIdRaw)

  if (!isEngagementPersisted) {
    const state = memory.memoryGetLikeState(id, visitorId)
    return { ...state, maxLikes: MAX_LIKES_PER_VISITOR }
  }

  await ensureEngagementSchema()
  const { rows: totalRows } = await sql<{ likes: number }>`
    SELECT likes FROM zn_page_totals WHERE page_id = ${id}
  `
  const likes = totalRows[0]?.likes ?? 0

  let userLikes = 0
  if (visitorId && isValidVisitorId(visitorId)) {
    const { rows } = await sql<{ count: number }>`
      SELECT count FROM zn_visitor_likes
      WHERE page_id = ${id} AND visitor_id = ${visitorId}
    `
    userLikes = rows[0]?.count ?? 0
  }

  return { likes, userLikes, maxLikes: MAX_LIKES_PER_VISITOR }
}

export async function recordView(
  pageIdRaw: string,
  visitorId: string
): Promise<{ views: number; recorded: boolean }> {
  const id = pageId(pageIdRaw)

  if (!isEngagementPersisted) {
    return memory.memoryRecordView(id, visitorId)
  }

  await ensureEngagementSchema()

  const { rows } = await sql<{ last_viewed_at: Date }>`
    SELECT last_viewed_at FROM zn_visitor_views
    WHERE page_id = ${id} AND visitor_id = ${visitorId}
  `
  const last = rows[0]?.last_viewed_at
  if (last && Date.now() - new Date(last).getTime() < VIEW_DEDUP_TTL_MS) {
    return { views: await getViewCount(id), recorded: false }
  }

  await sql`
    INSERT INTO zn_visitor_views (page_id, visitor_id, last_viewed_at)
    VALUES (${id}, ${visitorId}, NOW())
    ON CONFLICT (page_id, visitor_id)
    DO UPDATE SET last_viewed_at = NOW()
  `
  const { rows: updated } = await sql<{ views: number }>`
    INSERT INTO zn_page_totals (page_id, views, likes)
    VALUES (${id}, 1, 0)
    ON CONFLICT (page_id)
    DO UPDATE SET views = zn_page_totals.views + 1
    RETURNING views
  `
  return { views: updated[0]?.views ?? 1, recorded: true }
}

/** Add one like (clap). Idempotent at max per visitor; cannot unlike. */
export async function addVisitorLike(
  pageIdRaw: string,
  visitorId: string
): Promise<LikeState & { added: boolean }> {
  const id = pageId(pageIdRaw)

  if (!isEngagementPersisted) {
    const result = memory.memoryAddLike(id, visitorId)
    return { ...result, maxLikes: MAX_LIKES_PER_VISITOR }
  }

  await ensureEngagementSchema()

  const { rows: userRows } = await sql<{ count: number }>`
    SELECT count FROM zn_visitor_likes
    WHERE page_id = ${id} AND visitor_id = ${visitorId}
  `
  const userLikes = userRows[0]?.count ?? 0

  if (userLikes >= MAX_LIKES_PER_VISITOR) {
    const likes = (await getLikeState(id, null)).likes
    return { likes, userLikes, maxLikes: MAX_LIKES_PER_VISITOR, added: false }
  }

  await sql`
    INSERT INTO zn_visitor_likes (page_id, visitor_id, count)
    VALUES (${id}, ${visitorId}, 1)
    ON CONFLICT (page_id, visitor_id)
    DO UPDATE SET count = zn_visitor_likes.count + 1
  `
  const { rows: totalRows } = await sql<{ likes: number }>`
    INSERT INTO zn_page_totals (page_id, views, likes)
    VALUES (${id}, 0, 1)
    ON CONFLICT (page_id)
    DO UPDATE SET likes = zn_page_totals.likes + 1
    RETURNING likes
  `

  return {
    likes: totalRows[0]?.likes ?? 1,
    userLikes: userLikes + 1,
    maxLikes: MAX_LIKES_PER_VISITOR,
    added: true
  }
}
