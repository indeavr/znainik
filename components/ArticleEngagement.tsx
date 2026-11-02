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
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<T>
}

type LikeResponse = {
  likes: number
  userLikes: number
}
type ViewResponse = { views: number }

/** A new article gets its own state, including any pending requests. */
export function ArticleEngagement({ pageId }: { pageId: string }) {
  const id = normalizeEngagementPageId(pageId)
  return id ? <EngagementCounts key={id} pageId={id} /> : null
}

function EngagementCounts({ pageId }: { pageId: string }) {
  const [likes, setLikes] = React.useState<number | null>(null)
  const [userLikes, setUserLikes] = React.useState(0)
  const [views, setViews] = React.useState<number | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [loadingViews, setLoadingViews] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [bump, setBump] = React.useState(false)
  const [error, setError] = React.useState('')
  const [loadAttempt, setLoadAttempt] = React.useState(0)
  const pending = React.useRef(false)
  const mutation = React.useRef<AbortController | null>(null)
  const statusId = React.useId()
  const atMax = userLikes >= MAX_LIKES_PER_VISITOR

  React.useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    async function loadEngagement() {
      setLoading(true)
      setLoadingViews(true)
      setError('')
      try {
        const visitor = getOrCreateVisitorId()
        await Promise.allSettled([
          fetchJson<LikeResponse>(
            `/api/likes?id=${encodeURIComponent(pageId)}&visitor=${encodeURIComponent(visitor)}`,
            { signal }
          )
            .then((data) => {
              if (signal.aborted) return
              setLikes(data.likes)
              setUserLikes(data.userLikes)
            })
            .catch(() => {
              if (!signal.aborted)
                setError('Харесванията не се заредиха. Опитай отново.')
            })
            .finally(() => {
              if (!signal.aborted) setLoading(false)
            }),
          fetchJson<ViewResponse>('/api/views', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: pageId, visitor }),
            signal
          })
            .then((data) => {
              if (!signal.aborted) setViews(data.views)
            })
            .finally(() => {
              if (!signal.aborted) setLoadingViews(false)
            })
        ])
      } catch {
        if (!signal.aborted) setError('Броячите не се заредиха. Опитай отново.')
      } finally {
        if (!signal.aborted) {
          setLoading(false)
          setLoadingViews(false)
        }
      }
    }

    void loadEngagement()
    return () => controller.abort()
  }, [pageId, loadAttempt])

  React.useEffect(() => () => mutation.current?.abort(), [])

  const onAddLike = async () => {
    if (atMax || loading || pending.current) return
    if (likes === null) {
      setLoadAttempt((attempt) => attempt + 1)
      return
    }

    pending.current = true
    setSaving(true)
    setError('')
    setLikes(likes + 1)
    setUserLikes(userLikes + 1)
    setBump(true)
    const controller = new AbortController()
    mutation.current = controller

    try {
      const data = await fetchJson<LikeResponse>('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pageId, visitor: getOrCreateVisitorId() }),
        signal: controller.signal
      })
      if (controller.signal.aborted) return
      setLikes(data.likes)
      setUserLikes(data.userLikes)
    } catch {
      if (controller.signal.aborted) return
      setLikes(likes)
      setUserLikes(userLikes)
      setError('Харесването не се запази. Опитай отново.')
    } finally {
      if (!controller.signal.aborted) {
        pending.current = false
        setSaving(false)
      }
    }
  }

  const likeLabel = loading
    ? 'Зареждане на харесванията'
    : likes === null
      ? 'Зареди харесванията отново'
      : atMax
        ? `Дадохте ${MAX_LIKES_PER_VISITOR} харесвания`
        : userLikes > 0
          ? `Харесай отново (${userLikes}/${MAX_LIKES_PER_VISITOR})`
          : 'Харесай статията'
  const viewsLabel =
    views === null
      ? loadingViews
        ? 'Зареждане на преглежданията'
        : 'Преглежданията са временно недостъпни'
      : `${views.toLocaleString('bg-BG')} преглеждания`

  return (
    <div className='zn-engage' role='group' aria-label='Отзвук на статията'>
      <div className='zn-engage-controls'>
        <button
          type='button'
          className={cs(
            'zn-engage-btn',
            userLikes > 0 && 'is-liked',
            atMax && 'is-maxed'
          )}
          onClick={onAddLike}
          disabled={loading || saving || atMax}
          aria-busy={loading || saving}
          aria-label={likeLabel}
          aria-describedby={statusId}
          title={`${likeLabel}. До ${MAX_LIKES_PER_VISITOR} харесвания от читател.`}
        >
          <span
            className={cs('zn-engage-heart', bump && 'is-bump')}
            onAnimationEnd={() => setBump(false)}
            aria-hidden='true'
          >
            {userLikes > 0 ? <IoHeart /> : <IoHeartOutline />}
          </span>
          <span className='zn-engage-count' aria-hidden='true'>
            {likes === null ? '—' : formatCount(likes)}
          </span>
        </button>
        <span className='zn-engage-divider' aria-hidden='true' />
        <span className='zn-engage-views' title={viewsLabel}>
          <IoEyeOutline aria-hidden='true' />
          <span className='zn-engage-count' aria-hidden='true'>
            {views === null ? '—' : formatCount(views)}
          </span>
          <span className='sr-only'>{viewsLabel}</span>
        </span>
      </div>
      <span
        id={statusId}
        role='status'
        className={error ? 'zn-engage-error' : 'sr-only'}
      >
        {error ||
          (likes !== null
            ? `${likes.toLocaleString('bg-BG')} харесвания общо. Твоите: ${userLikes} от ${MAX_LIKES_PER_VISITOR}.`
            : '')}
      </span>
    </div>
  )
}
