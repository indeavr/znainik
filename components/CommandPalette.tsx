import { useRouter } from 'next/router'
import * as React from 'react'

import type { Article } from '@/lib/get-articles'
import { fetchArticleFeed } from '@/lib/article-feed'
import { searchArticles } from '@/lib/article-search'

import { ContentSkeleton } from './ContentSkeleton'

/** Fired by header search triggers to open the palette programmatically. */
export const OPEN_SEARCH_EVENT = 'zn:open-search'

export function openCommandPalette() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OPEN_SEARCH_EVENT))
  }
}

/**
 * A ⌘K / Ctrl+K command palette that searches all articles by words and topics
 * (client-side over the cached /api/articles feed) and jumps to a page.
 */
export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [articles, setArticles] = React.useState<Article[]>([])
  const [loaded, setLoaded] = React.useState(false)
  const [error, setError] = React.useState(false)
  const pending = React.useRef(false)
  const [activeIndex, setActiveIndex] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const dialogRef = React.useRef<HTMLDivElement>(null)

  const load = React.useCallback(async () => {
    if (pending.current) return
    pending.current = true
    setError(false)
    try {
      setArticles(await fetchArticleFeed())
      setLoaded(true)
    } catch {
      setError(true)
    } finally {
      pending.current = false
    }
  }, [])

  React.useEffect(() => {
    if (!open) return
    const timer = window.setInterval(() => {
      if (!document.hidden) void load()
    }, 30_000)
    return () => window.clearInterval(timer)
  }, [open, load])

  const openPalette = React.useCallback(() => {
    setOpen(true)
    void load()
  }, [load])

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
        void load()
      } else if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    function onOpenEvent() {
      openPalette()
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener(OPEN_SEARCH_EVENT, onOpenEvent)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener(OPEN_SEARCH_EVENT, onOpenEvent)
    }
  }, [load, openPalette])

  React.useEffect(() => {
    if (open) {
      setActiveIndex(0)
      const previousFocus = document.activeElement as HTMLElement | null
      const previousOverflow = document.body.style.overflow
      const id = window.setTimeout(() => inputRef.current?.focus(), 30)
      document.body.style.overflow = 'hidden'
      function trapFocus(event: KeyboardEvent) {
        if (event.key !== 'Tab') return
        const controls = Array.from(
          dialogRef.current?.querySelectorAll<HTMLElement>(
            'input, button, a[href]'
          ) ?? []
        )
        const first = controls[0]
        const last = controls.at(-1)
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }
      document.addEventListener('keydown', trapFocus)
      return () => {
        window.clearTimeout(id)
        document.removeEventListener('keydown', trapFocus)
        document.body.style.overflow = previousOverflow
        if (previousFocus?.isConnected)
          previousFocus.focus({ preventScroll: true })
      }
    }
  }, [open])

  const results = React.useMemo(
    () => searchArticles(articles, query).slice(0, 12),
    [articles, query]
  )

  const go = React.useCallback(
    (article: Article) => {
      setOpen(false)
      setQuery('')
      void router.push(`/${article.slug}`)
    },
    [router]
  )

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(0, Math.min(i + 1, results.length - 1)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const article = results[Math.min(activeIndex, results.length - 1)]
      if (article) go(article)
    }
  }

  if (!open) return null

  return (
    <div className='zn-cmdk-overlay'>
      <button
        type='button'
        tabIndex={-1}
        aria-label='Затвори търсенето'
        className='zn-cmdk-backdrop'
        onClick={() => setOpen(false)}
      />
      <div
        ref={dialogRef}
        className='zn-cmdk'
        role='dialog'
        aria-modal='true'
        aria-label='Търсене'
      >
        <div className='zn-cmdk-input-row'>
          <SearchIcon />
          <input
            ref={inputRef}
            className='zn-cmdk-input'
            placeholder='Търси по дума или тема…'
            aria-label='Търси статии'
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveIndex(0)
            }}
            onKeyDown={onInputKeyDown}
          />
          <button
            type='button'
            className='zn-cmdk-close'
            aria-label='Затвори търсенето'
            onClick={() => setOpen(false)}
          >
            ×
          </button>
        </div>

        <div className='zn-cmdk-list'>
          {!loaded && !error && (
            <div className='zn-cmdk-empty'>
              <ContentSkeleton />
            </div>
          )}
          {error && (
            <div className='zn-cmdk-empty' role='status'>
              Търсенето временно не е достъпно.{' '}
              <button type='button' onClick={() => void load()}>
                Опитай отново
              </button>
            </div>
          )}
          {loaded && !error && results.length === 0 && (
            <div className='zn-cmdk-empty'>
              {query ? 'Няма съвпадения' : 'Започни да пишеш…'}
            </div>
          )}
          {!error &&
            results.map((article, index) => (
              <button
                type='button'
                key={article.pageId}
                className='zn-cmdk-item'
                data-active={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => go(article)}
              >
                <span className='zn-cmdk-item-emoji'>
                  {article.emoji || '✦'}
                </span>
                <span className='zn-cmdk-item-text'>
                  <div className='zn-cmdk-item-title'>{article.title}</div>
                  {(article.description || article.tags.length > 0) && (
                    <div className='zn-cmdk-item-sub'>
                      {article.tags.length > 0
                        ? article.tags.join(' · ')
                        : article.description}
                    </div>
                  )}
                </span>
              </button>
            ))}
        </div>

        <div className='zn-cmdk-footer'>
          <span>
            <span className='zn-kbd'>↑</span> <span className='zn-kbd'>↓</span>{' '}
            навигация
          </span>
          <span>
            <span className='zn-kbd'>↵</span> отвори
          </span>
        </div>
      </div>
    </div>
  )
}

function SearchIcon() {
  return (
    <svg
      width='20'
      height='20'
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
    >
      <circle cx='11' cy='11' r='7' stroke='currentColor' strokeWidth='2' />
      <path
        d='M21 21l-4.3-4.3'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}
