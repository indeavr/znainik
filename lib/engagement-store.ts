import { db } from './db'
import { engagementDbKey } from './engagement'

async function readCount(key: string): Promise<number> {
  const raw = await db.get(key)
  const n = Number(raw ?? 0)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

export async function getEngagementCount(
  kind: 'views' | 'likes',
  pageId: string
): Promise<number> {
  return readCount(engagementDbKey(kind, pageId))
}

export async function incrementViewCount(pageId: string): Promise<number> {
  const key = engagementDbKey('views', pageId)
  const views = (await readCount(key)) + 1
  await db.set(key, views)
  return views
}

export async function setLikeCount(
  pageId: string,
  liked: boolean
): Promise<number> {
  const key = engagementDbKey('likes', pageId)
  const likes = Math.max(0, (await readCount(key)) + (liked ? 1 : -1))
  await db.set(key, likes)
  return likes
}
