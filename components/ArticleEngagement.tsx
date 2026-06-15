import { IoEyeOutline } from '@react-icons/all-files/io5/IoEyeOutline'
import { IoHeart } from '@react-icons/all-files/io5/IoHeart'
import { IoHeartOutline } from '@react-icons/all-files/io5/IoHeartOutline'
import cs from 'classnames'
import * as React from 'react'

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`
  return String(n)
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

  React.useEffect(() => {
    if (!pageId) return
    const likedKey = `liked:${pageId}`
    const viewedKey = `viewed:${pageId}`
    setLiked(localStorage.getItem(likedKey) === '1')

    async function loadLikes() {
      try {
        const res = await fetch(`/api/likes?id=${encodeURIComponent(pageId)}`)
        const data = (await res.json()) as { likes?: number }
        setLikes(data.likes ?? 0)
      } catch {
        setLikes(0)
      }
    }

    async function trackView() {
      try {
        const alreadyViewed =
          sessionStorage.getItem(viewedKey) === '1'
        const res = await fetch('/api/views', {
          method: alreadyViewed ? 'GET' : 'POST',
          headers: { 'content-type': 'application/json' },
          body: alreadyViewed ? undefined : JSON.stringify({ id: pageId })
        }).then((r) =>
          alreadyViewed
            ? fetch(`/api/views?id=${encodeURIComponent(pageId)}`)
            : r
        )
        const data = (await res.json()) as { views?: number }
        setViews(data.views ?? 0)
        sessionStorage.setItem(viewedKey, '1')
      } catch {
        setViews(0)
      }
    }

    void loadLikes()
    void trackView()
  }, [pageId])

  const onToggleLike = React.useCallback(async () => {
    const next = !liked
    setLiked(next)
    setLikes((prev) => Math.max(0, (prev ?? 0) + (next ? 1 : -1)))
    if (next) {
      setBump(true)
      window.setTimeout(() => setBump(false), 320)
    }
    try {
      localStorage.setItem(`liked:${pageId}`, next ? '1' : '0')
      const res = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: pageId, liked: next })
      })
      const data = (await res.json()) as { likes?: number }
      if (typeof data.likes === 'number') setLikes(data.likes)
    } catch {
      /* keep optimistic value */
    }
  }, [liked, pageId])

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
