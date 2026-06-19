import { normalizeEngagementPageId } from './engagement'
import {
  MAX_LIKES_PER_VISITOR,
  VIEW_DEDUP_TTL_MS
} from './engagement-constants'

type Totals = { views: number; likes: number }

const totals = new Map<string, Totals>()
const visitorLikes = new Map<string, number>()
const visitorViews = new Map<string, number>()

function pageKey(pageId: string): string {
  return normalizeEngagementPageId(pageId)
}

function visitorLikeKey(pageId: string, visitorId: string): string {
  return `${pageKey(pageId)}:${visitorId}`
}

function visitorViewKey(pageId: string, visitorId: string): string {
  return `${pageKey(pageId)}:${visitorId}`
}

function getTotals(pageId: string): Totals {
  const key = pageKey(pageId)
  return totals.get(key) ?? { views: 0, likes: 0 }
}

function setTotals(pageId: string, next: Totals): void {
  totals.set(pageKey(pageId), next)
}

export function memoryGetViewCount(pageId: string): number {
  return getTotals(pageId).views
}

export function memoryGetLikeState(
  pageId: string,
  visitorId: string | null
): { likes: number; userLikes: number } {
  const { likes } = getTotals(pageId)
  const userLikes =
    visitorId != null
      ? (visitorLikes.get(visitorLikeKey(pageId, visitorId)) ?? 0)
      : 0
  return { likes, userLikes }
}

export function memoryRecordView(
  pageId: string,
  visitorId: string
): { views: number; recorded: boolean } {
  const key = visitorViewKey(pageId, visitorId)
  const last = visitorViews.get(key) ?? 0
  const now = Date.now()
  const current = getTotals(pageId)

  if (last && now - last < VIEW_DEDUP_TTL_MS) {
    return { views: current.views, recorded: false }
  }

  visitorViews.set(key, now)
  const views = current.views + 1
  setTotals(pageId, { ...current, views })
  return { views, recorded: true }
}

export function memoryAddLike(
  pageId: string,
  visitorId: string
): {
  likes: number
  userLikes: number
  added: boolean
} {
  const likeKey = visitorLikeKey(pageId, visitorId)
  const userLikes = visitorLikes.get(likeKey) ?? 0
  const current = getTotals(pageId)

  if (userLikes >= MAX_LIKES_PER_VISITOR) {
    return { likes: current.likes, userLikes, added: false }
  }

  const nextUserLikes = userLikes + 1
  const likes = current.likes + 1
  visitorLikes.set(likeKey, nextUserLikes)
  setTotals(pageId, { ...current, likes })
  return { likes, userLikes: nextUserLikes, added: true }
}
