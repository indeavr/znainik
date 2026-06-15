import { IoArrowBack } from '@react-icons/all-files/io5/IoArrowBack'
import { IoArrowForward } from '@react-icons/all-files/io5/IoArrowForward'
import { type ExtendedRecordMap } from 'notion-types'
import * as React from 'react'
import { NotionRenderer } from 'react-notion-x'

import { type Hero, type Tale } from '@/lib/story'
import { useDarkMode } from '@/lib/use-dark-mode'

import { EpisodeTimeline } from './EpisodeTimeline'
import { HeroCodex, HeroDetail } from './HeroCodex'

/** Interactive tale page: timeline + centered episode body + compact hero strip. */
export function StoryExperience({
  tale,
  heroes,
  notionPages = {}
}: {
  tale: Tale
  heroes: Hero[]
  notionPages?: Record<string, ExtendedRecordMap>
}) {
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [openHeroId, setOpenHeroId] = React.useState<string | undefined>()
  const contentRef = React.useRef<HTMLDivElement>(null)
  const { isDarkMode } = useDarkMode()

  const episode = tale.episodes[activeIndex]
  const openHero = heroes.find((h) => h.id === openHeroId)
  const heroById = React.useMemo(
    () => new Map(heroes.map((h) => [h.id, h])),
    [heroes]
  )

  const selectEpisode = React.useCallback((index: number) => {
    setActiveIndex(index)
    // keep the reader anchored to the content when stepping through phases
    window.requestAnimationFrame(() => {
      contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])

  // Close the hero modal on Escape and lock background scroll while open.
  React.useEffect(() => {
    if (!openHeroId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenHeroId(undefined)
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [openHeroId])

  const episodeHeroes = (episode?.heroes ?? [])
    .map((id) => heroById.get(id))
    .filter((h): h is Hero => h !== undefined)

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

      {heroes.length > 0 && (
        <HeroCodex
          heroes={heroes}
          activeId={openHeroId}
          onOpen={(id) => setOpenHeroId(id)}
        />
      )}

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

              {episodeHeroes.length > 0 && (
                <div className='zn-story-spotlight'>
                  <span className='zn-story-spotlight-label'>В този епизод</span>
                  <div className='zn-story-spotlight-row'>
                    {episodeHeroes.map((hero) => (
                      <button
                        key={hero.id}
                        type='button'
                        className='zn-story-spotlight-hero'
                        onClick={() => setOpenHeroId(hero.id)}
                      >
                        <img src={hero.image} alt={hero.name} loading='lazy' />
                        <span>{hero.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
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

      {openHero && (
        <div className='zn-hero-modal-overlay'>
          <button
            type='button'
            aria-label='Затвори'
            className='zn-hero-modal-backdrop'
            onClick={() => setOpenHeroId(undefined)}
          />
          <div
            className='zn-hero-modal'
            role='dialog'
            aria-modal='true'
            aria-label={openHero.name}
          >
            <HeroDetail
              hero={openHero}
              onClose={() => setOpenHeroId(undefined)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
