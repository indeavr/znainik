import { useRouter } from 'next/router'
import * as React from 'react'

import type { Article } from '@/lib/get-articles'

/** Fired by header search triggers to open the palette programmatically. */
export const OPEN_SEARCH_EVENT = 'zn:open-search'

export function openCommandPalette() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OPEN_SEARCH_EVENT))
  }
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replaceAll(/[\u0300-\u036F]/g, '')
}

function scoreArticle(article: Article, query: string): number {
  if (!query) return 1
  const haystack = normalize(
    `${article.title} ${article.description} ${article.tags.join(' ')}`
  )
  const needle = normalize(query)
  if (haystack.includes(needle)) {
    // earlier matches (esp. in title) rank higher
    const titleHit = normalize(article.title).includes(needle)
    return titleHit ? 100 - haystack.indexOf(needle) : 50
  }
  // fuzzy: every character appears in order
  let i = 0
  for (const ch of haystack) {
    if (ch === needle[i]) i++
    if (i === needle.length) return 10
  }
  return 0
}

/**
 * A ⌘K / Ctrl+K command palette that fuzzy-searches all articles instantly
 * (client-side over the cached /api/articles feed) and jumps to a page.
 */
export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [articles, setArticles] = React.useState<Article[]>([])
  const [loaded, setLoaded] = React.useState(false)
  const [activeIndex, setActiveIndex] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const load = React.useCallback(async () => {
    if (loaded) return
    try {
      const res = await fetch('/api/articles')
      const data = (await res.json()) as { articles?: Article[] }
      setArticles(data.articles ?? [])
    } catch {
      setArticles([])
    } finally {
      setLoaded(true)
    }
  }, [loaded])

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
      const id = window.setTimeout(() => inputRef.current?.focus(), 30)
      document.body.style.overflow = 'hidden'
      return () => {
        window.clearTimeout(id)
        document.body.style.overflow = ''
      }
    }
  }, [open])

  const results = React.useMemo(() => {
    return articles
      .map((article) => ({ article, score: scoreArticle(article, query) }))
      .filter((r) => r.score > 0)
      .toSorted((a, b) => b.score - a.score)
      .slice(0, 12)
      .map((r) => r.article)
  }, [articles, query])

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
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const article = results[activeIndex]
      if (article) go(article)
    }
  }

  if (!open) return null

  return (
    <div className='zn-cmdk-overlay'>
      <button
        type='button'
        aria-label='Затвори търсенето'
        className='zn-cmdk-backdrop'
        onClick={() => setOpen(false)}
      />
      <div className='zn-cmdk' role='dialog' aria-modal='true' aria-label='Търсене'>
        <div className='zn-cmdk-input-row'>
          <SearchIcon />
          <input
            ref={inputRef}
            className='zn-cmdk-input'
            placeholder='Търси из Есенциите…'
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveIndex(0)
            }}
            onKeyDown={onInputKeyDown}
          />
          <span className='zn-kbd'>ESC</span>
        </div>

        <div className='zn-cmdk-list'>
          {!loaded && <div className='zn-cmdk-empty'>Зареждане…</div>}
          {loaded && results.length === 0 && (
            <div className='zn-cmdk-empty'>
              {query ? 'Няма съвпадения' : 'Започни да пишеш…'}
            </div>
          )}
          {results.map((article, index) => (
            <button
              type='button'
              key={article.pageId}
              className='zn-cmdk-item'
              data-active={index === activeIndex}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => go(article)}
            >
              <span className='zn-cmdk-item-emoji'>{article.emoji || '✦'}</span>
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
