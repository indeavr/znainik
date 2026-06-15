import { IoClose } from '@react-icons/all-files/io5/IoClose'
import cs from 'classnames'
import * as React from 'react'

import { type Hero } from '@/lib/story'

/** Grid of hero portraits. Clicking a portrait opens the hero detail panel. */
export function HeroCodex({
  heroes,
  activeId,
  onOpen
}: {
  heroes: Hero[]
  activeId?: string
  onOpen: (id: string) => void
}) {
  if (!heroes.length) return null

  return (
    <div className='zn-codex'>
      <h2 className='zn-codex-title'>Кодекс на героите</h2>
      <p className='zn-codex-sub'>Цъкни герой, за да научиш повече за него.</p>

      <ul className='zn-codex-grid'>
        {heroes.map((hero) => (
          <li key={hero.id}>
            <button
              type='button'
              className={cs(
                'zn-hero-card',
                activeId === hero.id && 'is-active'
              )}
              onClick={() => onOpen(hero.id)}
            >
              <span className='zn-hero-portrait'>
                <img src={hero.image} alt={hero.name} loading='lazy' />
              </span>
              <span className='zn-hero-name'>{hero.name}</span>
              {hero.title && (
                <span className='zn-hero-role'>{hero.title}</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Full hero detail panel, shown inline below the codex on the same page. */
export function HeroDetail({
  hero,
  onClose
}: {
  hero: Hero
  onClose: () => void
}) {
  return (
    <div className='zn-hero-detail' role='dialog' aria-label={hero.name}>
      <button
        type='button'
        className='zn-hero-detail-close'
        onClick={onClose}
        aria-label='Затвори'
      >
        <IoClose />
      </button>

      <div className='zn-hero-detail-media'>
        <img src={hero.image} alt={hero.name} />
      </div>

      <div className='zn-hero-detail-body'>
        <h3 className='zn-hero-detail-name'>{hero.name}</h3>
        {hero.title && <p className='zn-hero-detail-role'>{hero.title}</p>}

        {hero.traits && hero.traits.length > 0 && (
          <ul className='zn-hero-traits'>
            {hero.traits.map((trait) => (
              <li key={trait}>{trait}</li>
            ))}
          </ul>
        )}

        {hero.description.map((para, i) => (
          <p key={i} className='zn-hero-detail-text'>
            {para}
          </p>
        ))}
      </div>
    </div>
  )
}
