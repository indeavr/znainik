import cs from 'classnames'
import * as React from 'react'

import { SHELF, type ShowcaseTaleId } from '@/lib/tale-showcase'

import { BookCover } from './BookCover'

/** The four covers on one shelf; each opens its tale below. */
export function TaleShelf() {
  return (
    <ul className='tl-shelf' aria-label='Четирите приказки'>
      {SHELF.map((tale) => (
        <li key={tale.id} className={`tl-shelf-item tl-shelf-${tale.id}`}>
          <a href={`#${tale.id}`} className='tl-shelf-link'>
            <BookCover
              cover={tale.cover}
              sizes='(max-width: 640px) 24vw, 200px'
              priority
            />
            <span className='tl-shelf-name'>{tale.name}</span>
            <span className='tl-shelf-tag'>{tale.tag}</span>
          </a>
        </li>
      ))}
    </ul>
  )
}

/**
 * A sticky row with the four names; the tale in view is marked.
 * Works without JavaScript as plain anchors.
 */
export function TaleNav() {
  const [active, setActive] = React.useState<ShowcaseTaleId | null>(null)

  React.useEffect(() => {
    const sections: HTMLElement[] = []
    for (const tale of SHELF) {
      const section = document.querySelector<HTMLElement>(`#${tale.id}`)
      if (section) sections.push(section)
    }
    if (!sections.length || !('IntersectionObserver' in window)) return

    const visible = new Map<string, number>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visible.set(entry.target.id, entry.intersectionRatio)
        }
        let best: string | null = null
        let bestRatio = 0
        for (const [id, ratio] of visible) {
          if (ratio > bestRatio) {
            best = id
            bestRatio = ratio
          }
        }
        setActive(bestRatio > 0 ? (best as ShowcaseTaleId) : null)
      },
      {
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
        rootMargin: '-120px 0px -35% 0px'
      }
    )
    for (const section of sections) observer.observe(section)
    return () => observer.disconnect()
  }, [])

  return (
    <nav className='tl-nav' aria-label='Приказките'>
      <div className='zn-container tl-nav-inner'>
        {SHELF.map((tale) => (
          <a
            key={tale.id}
            href={`#${tale.id}`}
            className={cs('tl-nav-link', `tl-nav-${tale.id}`)}
            aria-current={active === tale.id ? 'true' : undefined}
          >
            <span className='tl-nav-dot' aria-hidden='true' />
            {tale.name}
          </a>
        ))}
      </div>
    </nav>
  )
}
