import { IoEyeOutline } from '@react-icons/all-files/io5/IoEyeOutline'
import { IoHeart } from '@react-icons/all-files/io5/IoHeart'
import { IoHeartOutline } from '@react-icons/all-files/io5/IoHeartOutline'
import cs from 'classnames'
import * as React from 'react'

import {
  engagementClientKey,
  normalizeEngagementPageId
} from '@/lib/engagement'

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

/**
 * Medium-style engagement rail: a like (heart) toggle and a view counter.
 * Likes are capped to one per device via localStorage; a view is recorded once
 * per browser session. Both persist server-side via /api/likes and /api/views.
 */
export function ArticleEngagement({ pageId }: { pageId: string }) {
  const [likes, setLikes] = React.useState<number | null>(null)
  const [liked, setLiked] = React.useState(false)
  const [views, setViews] = React.useState<number | null>(null)
  const [bump, setBump] = React.useState(false)

  const normalizedId = React.useMemo(
    () => normalizeEngagementPageId(pageId),
    [pageId]
  )

  React.useEffect(() => {
    if (!normalizedId) return

    let cancelled = false
    const likedKey = engagementClientKey('liked', normalizedId)
    const viewedKey = engagementClientKey('viewed', normalizedId)

    setLiked(localStorage.getItem(likedKey) === '1')

    async function loadLikes() {
      try {
        const data = await fetchJson<{ likes?: number }>(
          `/api/likes?id=${encodeURIComponent(normalizedId)}`
        )
        if (!cancelled) setLikes(data.likes ?? 0)
      } catch {
        if (!cancelled) setLikes(0)
      }
    }

    async function trackView() {
      const alreadyViewed = sessionStorage.getItem(viewedKey) === '1'

      try {
        if (alreadyViewed) {
          const data = await fetchJson<{ views?: number }>(
            `/api/views?id=${encodeURIComponent(normalizedId)}`
          )
          if (!cancelled) setViews(data.views ?? 0)
          return
        }

        // Mark before POST so React Strict Mode / fast remounts don't double-count.
        sessionStorage.setItem(viewedKey, '1')

        const data = await fetchJson<{ views?: number }>('/api/views', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: normalizedId })
        })
        if (!cancelled) setViews(data.views ?? 0)
      } catch {
        sessionStorage.removeItem(viewedKey)
        if (!cancelled) setViews(0)
      }
    }

    void loadLikes()
    void trackView()

    return () => {
      cancelled = true
    }
  }, [normalizedId])

  const onToggleLike = React.useCallback(async () => {
    const likedKey = engagementClientKey('liked', normalizedId)
    const next = !liked
    setLiked(next)
    setLikes((prev) => Math.max(0, (prev ?? 0) + (next ? 1 : -1)))
    if (next) {
      setBump(true)
      window.setTimeout(() => setBump(false), 320)
    }

    try {
      localStorage.setItem(likedKey, next ? '1' : '0')
      const data = await fetchJson<{ likes?: number }>('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: normalizedId, liked: next })
      })
      if (typeof data.likes === 'number') setLikes(data.likes)
    } catch {
      /* keep optimistic value */
    }
  }, [liked, normalizedId])

  return (
    <div className='zn-engage'>
      <button
        type='button'
        className={cs('zn-engage-btn', liked && 'is-liked', bump && 'is-bump')}
        onClick={onToggleLike}
        aria-pressed={liked}
        aria-label={liked ? 'Премахни харесване' : 'Хареса ми'}
        title='Хареса ми'
      >
        {liked ? <IoHeart /> : <IoHeartOutline />}
      </button>
      <span className='zn-engage-count'>
        {likes === null ? '·' : formatCount(likes)}
      </span>

      <span className='zn-engage-divider' aria-hidden='true' />

      <span className='zn-engage-views' title='Прочитания'>
        <IoEyeOutline />
        <span className='zn-engage-count'>
          {views === null ? '·' : formatCount(views)}
        </span>
      </span>
    </div>
  )
}
