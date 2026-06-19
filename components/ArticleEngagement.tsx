import { IoEyeOutline } from '@react-icons/all-files/io5/IoEyeOutline'
import { IoHeart } from '@react-icons/all-files/io5/IoHeart'
import { IoHeartOutline } from '@react-icons/all-files/io5/IoHeartOutline'
import cs from 'classnames'
import * as React from 'react'

import { normalizeEngagementPageId } from '@/lib/engagement'
import { MAX_LIKES_PER_VISITOR } from '@/lib/engagement-constants'
import { getOrCreateVisitorId } from '@/lib/engagement-visitor'

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`
  return String(n)
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

type LikeResponse = {
  likes?: number
  userLikes?: number
  maxLikes?: number
  added?: boolean
  persisted?: boolean
}
type ViewResponse = { views?: number; persisted?: boolean }

/**
 * Engagement rail: claps (up to 13 per visitor, no unlike) + views.
 */
export function ArticleEngagement({ pageId }: { pageId: string }) {
  const [likes, setLikes] = React.useState<number | null>(null)
  const [userLikes, setUserLikes] = React.useState(0)
  const [views, setViews] = React.useState<number | null>(null)
  const [bump, setBump] = React.useState(false)
  const [storageWarning, setStorageWarning] = React.useState(false)

  const normalizedId = React.useMemo(
    () => normalizeEngagementPageId(pageId),
    [pageId]
  )

  const atMax = userLikes >= MAX_LIKES_PER_VISITOR

  React.useEffect(() => {
    if (!normalizedId) return

    let cancelled = false
    const visitor = getOrCreateVisitorId()
    if (!visitor) return

    async function loadEngagement() {
      try {
        const [likeData, viewData] = await Promise.all([
          fetchJson<LikeResponse>(
            `/api/likes?id=${encodeURIComponent(normalizedId)}&visitor=${encodeURIComponent(visitor)}`
          ),
          fetchJson<ViewResponse>('/api/views', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: normalizedId, visitor })
          })
        ])

        if (cancelled) return
        setLikes(likeData.likes ?? 0)
        setUserLikes(likeData.userLikes ?? 0)
        setViews(viewData.views ?? 0)
        if (likeData.persisted === false || viewData.persisted === false) {
          setStorageWarning(true)
        }
      } catch {
        if (!cancelled) {
          setLikes(0)
          setViews(0)
        }
      }
    }

    void loadEngagement()

    return () => {
      cancelled = true
    }
  }, [normalizedId])

  const onAddLike = React.useCallback(async () => {
    if (atMax) return

    const visitor = getOrCreateVisitorId()
    if (!visitor) return

    setUserLikes((prev) => prev + 1)
    setLikes((prev) => (prev ?? 0) + 1)
    setBump(true)
    window.setTimeout(() => setBump(false), 320)

    try {
      const data = await fetchJson<LikeResponse>('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: normalizedId, visitor })
      })
      if (typeof data.likes === 'number') setLikes(data.likes)
      if (typeof data.userLikes === 'number') setUserLikes(data.userLikes)
      if (data.added === false) {
        setUserLikes(data.userLikes ?? MAX_LIKES_PER_VISITOR)
        setLikes(data.likes ?? 0)
      }
    } catch {
      setUserLikes((prev) => Math.max(0, prev - 1))
      setLikes((prev) => Math.max(0, (prev ?? 1) - 1))
    }
  }, [atMax, normalizedId])

  const hasClapped = userLikes > 0

  return (
    <div className='zn-engage'>
      <button
        type='button'
        className={cs(
          'zn-engage-btn',
          hasClapped && 'is-liked',
          bump && 'is-bump',
          atMax && 'is-maxed'
        )}
        onClick={onAddLike}
        disabled={atMax}
        aria-label={
          atMax
            ? `Дадохте ${MAX_LIKES_PER_VISITOR} харесвания`
            : hasClapped
              ? `Харесай отново (${userLikes}/${MAX_LIKES_PER_VISITOR})`
              : 'Хареса ми'
        }
        title={
          atMax
            ? `Максимум ${MAX_LIKES_PER_VISITOR} харесвания`
            : `Харесай (${userLikes}/${MAX_LIKES_PER_VISITOR})`
        }
      >
        {hasClapped ? <IoHeart /> : <IoHeartOutline />}
      </button>
      <span className='zn-engage-count'>
        {likes === null ? '·' : formatCount(likes)}
      </span>

      <span className='zn-engage-divider' aria-hidden='true' />

      <span
        className='zn-engage-views'
        title={
          storageWarning
            ? 'Свържи Vercel Postgres (Neon) за постоянни броячи в production'
            : 'Прочитания'
        }
      >
        <IoEyeOutline />
        <span className='zn-engage-count'>
          {views === null ? '·' : formatCount(views)}
        </span>
      </span>
    </div>
  )
}
