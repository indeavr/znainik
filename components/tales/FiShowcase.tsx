import { COURSE_URLS, COVERS, FI } from '@/lib/tale-showcase'

import { BookCover } from './BookCover'
import { OnlineLinks, type OnlineSeries } from './OnlineLinks'
import { ElementSymbol, GoldenSpiral } from './TaleSymbols'

const ELEMENT_NAMES = {
  spiral: 'Фи',
  fire: 'Огън',
  air: 'Въздух',
  water: 'Вода',
  earth: 'Земя'
} as const

/** „Фи“: the golden spiral through the four elements. */
export function FiShowcase({ online }: { online: OnlineSeries[] }) {
  return (
    <section id='fi' className='tl-tale tl-fi' aria-labelledby='fi-title'>
      <div className='zn-container tl-tale-inner'>
        <div className='tl-intro tl-intro-flip'>
          <div className='tl-intro-cover'>
            <GoldenSpiral className='tl-fi-spiral' />
            <BookCover
              cover={COVERS.fi}
              sizes='(max-width: 720px) 62vw, 340px'
            />
          </div>

          <div className='tl-intro-text'>
            <p className='tl-kicker'>
              <span className='tl-kicker-mark tl-fi-phi' aria-hidden='true'>
                φ
              </span>
              {FI.kicker}
            </p>
            <h2 id='fi-title' className='tl-title tl-fi-title'>
              {FI.title}
            </h2>
            <p className='tl-logline'>{FI.logline}</p>

            <ul className='tl-fi-elements' aria-label='Четирите стихии'>
              {(['fire', 'air', 'water', 'earth'] as const).map((element) => (
                <li key={element} data-element={element}>
                  <span className='tl-fi-element-mark'>
                    <ElementSymbol element={element} />
                  </span>
                  {ELEMENT_NAMES[element]}
                </li>
              ))}
            </ul>

            <div className='tl-about'>
              {FI.about.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <ul className='tl-facts' aria-label='За книгата'>
              {FI.facts.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>

            <div className='tl-actions'>
              <a
                className='tl-btn tl-btn-primary'
                href={COURSE_URLS.fi}
                target='_blank'
                rel='noopener noreferrer'
              >
                Обучението „Изкуството на Паузата“{' '}
                <span aria-hidden='true'>↗</span>
              </a>
              <OnlineLinks
                series={online}
                label={() => 'Чети епизодите онлайн'}
              />
            </div>
          </div>
        </div>

        <div className='tl-contents'>
          <h3 className='tl-contents-title'>Съдържание · Книга първа</h3>
          <ol className='tl-fi-parts'>
            {FI.parts.map((part) => (
              <li key={part.kick} data-element={part.element}>
                <span className='tl-fi-part-mark'>
                  <ElementSymbol element={part.element} strokeWidth={1.6} />
                </span>
                <span className='tl-fi-part-kick'>{part.kick}</span>
                <span className='tl-fi-part-title'>{part.title}</span>
                <span className='tl-fi-part-chapters'>
                  {part.chapters.join(' · ')}
                </span>
              </li>
            ))}
          </ol>
          <p className='tl-contents-next'>{FI.next}</p>
        </div>

        <div className='tl-fi-path'>
          <h3 className='tl-contents-title'>Пътят през стихиите</h3>
          <ol className='tl-fi-scenes tl-scroller'>
            {FI.scenes.map((scene) => (
              <li key={scene.title} data-element={scene.element}>
                <span className='tl-fi-scene-art'>
                  <img
                    src={scene.image}
                    alt={scene.alt}
                    width={720}
                    height={480}
                    loading='lazy'
                    decoding='async'
                  />
                  {scene.upcoming && (
                    <span className='tl-fi-scene-badge'>Следва</span>
                  )}
                </span>
                <span className='tl-fi-scene-title'>
                  <span className='tl-fi-scene-mark'>
                    <ElementSymbol element={scene.element} />
                  </span>
                  {scene.title}
                </span>
                <span className='tl-fi-scene-text'>{scene.text}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className='tl-heroes'>
          <h3 className='tl-contents-title'>Герои</h3>
          <ul>
            {FI.heroes.map((hero) => (
              <li key={hero}>{hero}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
