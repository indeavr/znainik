import { IoArrowBack } from '@react-icons/all-files/io5/IoArrowBack'
import { IoArrowForward } from '@react-icons/all-files/io5/IoArrowForward'
import { type ExtendedRecordMap } from 'notion-types'
import * as React from 'react'
import { NotionRenderer } from 'react-notion-x'

import { type Tale } from '@/lib/story'
import { useDarkMode } from '@/lib/use-dark-mode'

import { EpisodeTimeline } from './EpisodeTimeline'
import { HeroTags } from './HeroTags'

/** Interactive tale page: timeline + centered episode body + hero slug tags. */
export function StoryExperience({
  tale,
  notionPages = {}
}: {
  tale: Tale
  notionPages?: Record<string, ExtendedRecordMap>
}) {
  const [activeIndex, setActiveIndex] = React.useState(0)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const { isDarkMode } = useDarkMode()

  const episode = tale.episodes[activeIndex]

  const selectEpisode = React.useCallback((index: number) => {
    setActiveIndex(index)
    window.requestAnimationFrame(() => {
      contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])

  const episodeRecordMap = episode?.notionPageId
    ? notionPages[episode.id]
    : undefined

  return (
    <div className='zn-story'>
      <EpisodeTimeline
        episodes={tale.episodes}
        activeIndex={activeIndex}
        onSelect={selectEpisode}
      />

      <div className='zn-story-layout'>
        <article className='zn-story-content' ref={contentRef}>
          {episode && (
            <>
              <header className='zn-story-content-head'>
                <h2 className='zn-story-content-title'>
                  <span className='zn-story-content-icon'>{episode.icon}</span>
                  {episode.title}
                </h2>
              </header>

              {episodeRecordMap ? (
                <div className='zn-story-notion notion'>
                  <NotionRenderer
                    recordMap={episodeRecordMap}
                    fullPage={false}
                    darkMode={isDarkMode}
                  />
                </div>
              ) : (
                <div className='zn-story-prose'>
                  {(episode.content ?? []).map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              )}

              {episode.href && (
                <a
                  className='zn-story-readmore'
                  href={episode.href}
                  target={episode.href.startsWith('http') ? '_blank' : undefined}
                  rel={
                    episode.href.startsWith('http')
                      ? 'noopener noreferrer'
                      : undefined
                  }
                >
                  Прочети повече →
                </a>
              )}

              {(episode.heroes ?? []).length > 0 && (
                <HeroTags
                  slugs={episode.heroes ?? []}
                  label='В този епизод'
                />
              )}

              <nav className='zn-story-nav'>
                <button
                  type='button'
                  className='zn-story-nav-btn'
                  disabled={activeIndex === 0}
                  onClick={() => selectEpisode(Math.max(0, activeIndex - 1))}
                >
                  <IoArrowBack /> Назад
                </button>
                <button
                  type='button'
                  className='zn-story-nav-btn is-primary'
                  disabled={activeIndex === tale.episodes.length - 1}
                  onClick={() =>
                    selectEpisode(
                      Math.min(tale.episodes.length - 1, activeIndex + 1)
                    )
                  }
                >
                  Напред <IoArrowForward />
                </button>
              </nav>
            </>
          )}
        </article>
      </div>
    </div>
  )
}
