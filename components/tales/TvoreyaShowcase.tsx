import { COURSE_URLS, COVERS, TVOREYA } from '@/lib/tale-showcase'

import { BookCover } from './BookCover'
import { OnlineLinks, type OnlineSeries } from './OnlineLinks'
import { EpisodeSymbol } from './TaleSymbols'

/** „Творея“: the creator's path, from the back cover to the five thresholds. */
export function TvoreyaShowcase({ online }: { online: OnlineSeries[] }) {
  return (
    <section
      id='tvoreya'
      className='tl-tale tl-tvoreya'
      aria-labelledby='tvoreya-title'
    >
      <div className='zn-container tl-tale-inner'>
        <figure className='tl-tv-back'>
          <blockquote>
            {TVOREYA.tagline.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </blockquote>
          <ul className='tl-tv-signs' aria-hidden='true'>
            {(['e1', 'e2', 'e3', 'e4', 'e5'] as const).map((symbol) => (
              <li key={symbol}>
                <EpisodeSymbol symbol={symbol} strokeWidth={1.2} />
              </li>
            ))}
          </ul>
          <figcaption>От гърба на корицата</figcaption>
        </figure>

        <div className='tl-intro'>
          <div className='tl-intro-cover'>
            <BookCover
              cover={COVERS.tvoreya}
              sizes='(max-width: 720px) 62vw, 340px'
            />
          </div>

          <div className='tl-intro-text'>
            <p className='tl-kicker'>
              <span className='tl-kicker-mark'>
                <EpisodeSymbol symbol='e1' />
              </span>
              {TVOREYA.kicker}
            </p>
            <h2 id='tvoreya-title' className='tl-title tl-tv-title'>
              {TVOREYA.title}
            </h2>

            <div className='tl-tv-blurb'>
              {TVOREYA.blurb.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              <p className='tl-tv-blurb-close'>{TVOREYA.blurbClose}</p>
            </div>

            <div className='tl-about'>
              {TVOREYA.about.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <ul className='tl-facts' aria-label='За книгата'>
              {TVOREYA.facts.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>

            <div className='tl-actions'>
              <a
                className='tl-btn tl-btn-primary'
                href={COURSE_URLS.tvoreya}
                target='_blank'
                rel='noopener noreferrer'
              >
                Школата „Раз-Твори се“ <span aria-hidden='true'>↗</span>
              </a>
              <OnlineLinks
                series={online}
                label={() => 'Чети епизодите онлайн'}
              />
            </div>
          </div>
        </div>

        <div className='tl-tv-columns'>
          <div className='tl-contents'>
            <h3 className='tl-contents-title'>Съдържание · Книга първа</h3>
            <ol className='tl-tv-path'>
              {TVOREYA.episodes.map((episode) => (
                <li key={episode.title}>
                  <span className='tl-tv-step-mark'>
                    <EpisodeSymbol symbol={episode.symbol} />
                  </span>
                  <span className='tl-tv-step-body'>
                    <span className='tl-tv-step-kick'>{episode.kick}</span>
                    <span className='tl-tv-step-title'>{episode.title}</span>
                    {episode.chapters.length > 0 && (
                      <span className='tl-tv-step-chapters'>
                        {episode.chapters.join(' · ')}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ol>

            <div className='tl-tv-book-two'>
              <p className='tl-tv-book-two-title'>
                Книга втора <span>· пише се</span>
              </p>
              <ol>
                {TVOREYA.bookTwo.map((episode) => (
                  <li key={episode.n}>
                    <span className='tl-tv-book-two-n'>{episode.n}</span>
                    {episode.title}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <aside className='tl-tv-thieves'>
            <h3 className='tl-contents-title'>Двамата крадци на внимание</h3>
            <ul>
              {TVOREYA.thieves.map((thief) => (
                <li key={thief.name}>
                  <span className='tl-tv-thief-role'>{thief.role}</span>
                  <span className='tl-tv-thief-name'>{thief.name}</span>
                  <span className='tl-tv-thief-text'>{thief.text}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>

        <div className='tl-tv-mentors'>
          <h3 className='tl-contents-title'>Седемте Будечители</h3>
          <p className='tl-tv-mentors-sub'>
            Наставниците на творческото пробуждане, в реда на пътя.
          </p>
          <ol className='tl-scroller'>
            {TVOREYA.mentors.map((mentor, index) => (
              <li key={mentor.id}>
                <span className='tl-tv-mentor-face'>
                  <img
                    src={`/prikazki/mentors/${mentor.id}.webp`}
                    alt=''
                    width={240}
                    height={240}
                    loading='lazy'
                    decoding='async'
                  />
                  <span className='tl-tv-mentor-n' aria-hidden='true'>
                    {index + 1}
                  </span>
                </span>
                <span className='tl-tv-mentor-name'>{mentor.name}</span>
                <span className='tl-tv-mentor-gift'>{mentor.gift}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
