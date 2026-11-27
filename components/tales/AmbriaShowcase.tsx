import { AMBRIA, ATLAS_URL, COVERS } from '@/lib/tale-showcase'

import { BookCover } from './BookCover'
import { OnlineLinks, type OnlineSeries } from './OnlineLinks'
import { StarSymbol } from './TaleSymbols'

/** „Амбриа“: a picture book in five scenes. */
export function AmbriaShowcase({ online }: { online: OnlineSeries[] }) {
  return (
    <section
      id='ambria'
      className='tl-tale tl-ambria'
      aria-labelledby='ambria-title'
    >
      <span className='tl-am-sparkles' aria-hidden='true' />
      <div className='zn-container tl-tale-inner'>
        <div className='tl-intro'>
          <div className='tl-intro-cover'>
            <BookCover
              cover={COVERS.ambria}
              sizes='(max-width: 720px) 62vw, 320px'
            />
          </div>

          <div className='tl-intro-text'>
            <p className='tl-kicker'>
              <span className='tl-kicker-mark'>
                <StarSymbol />
              </span>
              {AMBRIA.kicker}
            </p>
            <h2 id='ambria-title' className='tl-title tl-am-title'>
              {AMBRIA.title}
            </h2>
            <p className='tl-logline'>{AMBRIA.logline}</p>

            <div className='tl-about'>
              {AMBRIA.about.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <ul className='tl-facts' aria-label='За приказката'>
              {AMBRIA.facts.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>

            <div className='tl-actions'>
              <a
                className='tl-btn tl-btn-primary'
                href={`${ATLAS_URL}#ambria`}
                target='_blank'
                rel='noopener noreferrer'
              >
                Амбриа в атласа на света <span aria-hidden='true'>↗</span>
              </a>
              <OnlineLinks series={online} label={() => 'Чети онлайн'} />
            </div>
          </div>
        </div>

        <div className='tl-contents'>
          <h3 className='tl-contents-title'>Съдържание · Пет картини</h3>
          <ol className='tl-am-pages tl-scroller'>
            {AMBRIA.scenes.map((scene, index) => (
              <li key={scene.title}>
                <span className='tl-am-page-art'>
                  <img
                    src={scene.image}
                    alt={scene.alt}
                    width={720}
                    height={480}
                    loading='lazy'
                    decoding='async'
                  />
                  <span className='tl-am-page-n' aria-hidden='true'>
                    {index + 1}
                  </span>
                </span>
                <span className='tl-am-page-title'>{scene.title}</span>
                <span className='tl-am-page-text'>{scene.text}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
