import { IoChevronBack } from '@react-icons/all-files/io5/IoChevronBack'
import { IoChevronForward } from '@react-icons/all-files/io5/IoChevronForward'
import cs from 'classnames'
import * as React from 'react'

import { type Episode } from '@/lib/story'

const COMPACT_THRESHOLD = 7

/**
 * Sticky episode navigator: current part label + progress + scrollable pill rail.
 * Scales down for long tales (10+ episodes).
 */
export function EpisodeTimeline({
  episodes,
  activeIndex,
  onSelect
}: {
  episodes: Episode[]
  activeIndex: number
  onSelect: (index: number) => void
}) {
  const activeItemRef = React.useRef<HTMLLIElement>(null)
  const episode = episodes[activeIndex]
  const total = episodes.length
  const compact = total > COMPACT_THRESHOLD
  const progress = total > 0 ? ((activeIndex + 1) / total) * 100 : 0

  React.useEffect(() => {
    activeItemRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center'
    })
  }, [activeIndex])

  const goPrev = () => onSelect(Math.max(0, activeIndex - 1))
  const goNext = () => onSelect(Math.min(total - 1, activeIndex + 1))

  return (
    <nav
      className={cs('zn-episode-nav', compact && 'is-compact')}
      aria-label='Навигация по епизоди'
    >
      <div className='zn-episode-nav-sticky'>
        <div className='zn-episode-now'>
          <div className='zn-episode-now-row'>
            <button
              type='button'
              className='zn-episode-stepper'
              onClick={goPrev}
              disabled={activeIndex === 0}
              aria-label='Предишен епизод'
            >
              <IoChevronBack />
            </button>

            <div className='zn-episode-now-body'>
              <p className='zn-episode-now-kicker'>
                Част {activeIndex + 1}{' '}
                <span className='zn-episode-now-total'>от {total}</span>
              </p>
              {episode && (
                <p className='zn-episode-now-title'>
                  <span className='zn-episode-now-icon' aria-hidden='true'>
                    {episode.icon}
                  </span>
                  <span className='zn-episode-now-title-text'>{episode.title}</span>
                </p>
              )}
            </div>

            <button
              type='button'
              className='zn-episode-stepper'
              onClick={goNext}
              disabled={activeIndex >= total - 1}
              aria-label='Следващ епизод'
            >
              <IoChevronForward />
            </button>
          </div>

          <div
            className='zn-episode-progress'
            role='progressbar'
            aria-valuemin={1}
            aria-valuemax={total}
            aria-valuenow={activeIndex + 1}
            aria-label={`Напредък: част ${activeIndex + 1} от ${total}`}
          >
            <span
              className='zn-episode-progress-fill'
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <ol className='zn-episode-rail' role='tablist'>
          {episodes.map((item, index) => {
            const isActive = index === activeIndex
            const isDone = index < activeIndex
            return (
              <li
                key={item.id}
                ref={isActive ? activeItemRef : undefined}
                className='zn-episode-rail-item'
              >
                <button
                  type='button'
                  role='tab'
                  aria-selected={isActive}
                  aria-label={`Част ${index + 1}: ${item.title}`}
                  title={item.title}
                  className={cs(
                    'zn-episode-pill',
                    isActive && 'is-active',
                    isDone && 'is-done'
                  )}
                  onClick={() => onSelect(index)}
                >
                  {!compact && (
                    <span className='zn-episode-pill-icon' aria-hidden='true'>
                      {item.icon}
                    </span>
                  )}
                  <span className='zn-episode-pill-num'>{index + 1}</span>
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    </nav>
  )
}
