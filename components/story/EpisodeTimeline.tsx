import cs from 'classnames'
import * as React from 'react'

import { type Episode } from '@/lib/story'

/**
 * Horizontal sequence of episode "phases" — clickable icon nodes connected by a
 * progress line. Selecting a node swaps the content shown below it.
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
  const progress =
    episodes.length > 1 ? (activeIndex / (episodes.length - 1)) * 100 : 0

  return (
    <div className='zn-timeline' role='tablist' aria-label='Епизоди'>
      <div className='zn-timeline-track' aria-hidden='true'>
        <span className='zn-timeline-fill' style={{ width: `${progress}%` }} />
      </div>

      <ol className='zn-timeline-nodes'>
        {episodes.map((episode, index) => {
          const isActive = index === activeIndex
          const isDone = index < activeIndex
          return (
            <li key={episode.id} className='zn-timeline-item'>
              <button
                type='button'
                role='tab'
                aria-selected={isActive}
                className={cs(
                  'zn-timeline-node',
                  isActive && 'is-active',
                  isDone && 'is-done'
                )}
                onClick={() => onSelect(index)}
              >
                <span className='zn-timeline-icon'>{episode.icon}</span>
                <span className='zn-timeline-step'>
                  {String(index + 1).padStart(2, '0')}
                </span>
              </button>
              <span className='zn-timeline-label'>{episode.title}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
