import Link from 'next/link'

import { ATLAS_URL, AZAIRA, COVERS } from '@/lib/tale-showcase'

import { BookCover } from './BookCover'
import { OnlineLinks, type OnlineSeries } from './OnlineLinks'
import { StarSymbol } from './TaleSymbols'

/** „Азайра“: the mythology as a star codex. */
export function AzairaShowcase({ online }: { online: OnlineSeries[] }) {
  const canonical = online[0]

  return (
    <section
      id='azaira'
      className='tl-tale tl-azaira'
      aria-labelledby='azaira-title'
    >
      <div className='tl-az-stars' aria-hidden='true' />

      <div className='zn-container tl-tale-inner'>
        <div className='tl-intro'>
          <div className='tl-intro-cover'>
            <BookCover
              cover={COVERS.azaira}
              sizes='(max-width: 720px) 62vw, 340px'
            />
          </div>

          <div className='tl-intro-text'>
            <p className='tl-kicker'>
              <span className='tl-kicker-mark'>
                <StarSymbol />
              </span>
              {AZAIRA.kicker}
            </p>
            <h2 id='azaira-title' className='tl-title tl-az-title'>
              {AZAIRA.title}
            </h2>
            <p className='tl-logline'>{AZAIRA.logline}</p>

            <div className='tl-about'>
              {AZAIRA.about.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <blockquote className='tl-az-forces'>
              <p>{AZAIRA.forces}</p>
              <p className='tl-az-forces-tail'>{AZAIRA.forcesTail}</p>
            </blockquote>

            <div className='tl-actions'>
              <a
                className='tl-btn tl-btn-primary'
                href={`${ATLAS_URL}#home`}
                target='_blank'
                rel='noopener noreferrer'
              >
                Разгледай атласа на света <span aria-hidden='true'>↗</span>
              </a>
              <OnlineLinks
                series={online}
                label={(s) => `Прочети „${s.title}“`}
              />
            </div>
          </div>
        </div>

        <ul className='tl-az-stats' aria-label='Светът в числа'>
          {AZAIRA.stats.map((stat) => (
            <li key={stat.label}>
              <span className='tl-az-stat-value'>{stat.value}</span>
              <span className='tl-az-stat-label'>{stat.label}</span>
            </li>
          ))}
        </ul>

        <div className='tl-az-figures'>
          <figure className='tl-az-orbit-figure'>
            <div className='tl-az-orbit'>
              <span className='tl-az-ring' aria-hidden='true' />
              <span className='tl-az-core'>
                <img
                  src='/prikazki/titans/azaira.webp'
                  alt='Спящата Азайра: лицето ѝ е сред гористи хълмове и вода.'
                  width={240}
                  height={240}
                  loading='lazy'
                  decoding='async'
                />
                <span className='tl-az-core-name'>Азайра · Земя</span>
              </span>
              {AZAIRA.titans.map((titan, index) => (
                <span
                  key={titan.id}
                  className='tl-az-titan'
                  style={
                    {
                      '--i': index,
                      '--n': AZAIRA.titans.length
                    } as React.CSSProperties
                  }
                >
                  <span className='tl-az-titan-face'>
                    <img
                      src={`/prikazki/titans/${titan.id}.webp`}
                      alt=''
                      width={240}
                      height={240}
                      loading='lazy'
                      decoding='async'
                    />
                    <span className='tl-az-glyph' aria-hidden='true'>
                      {titan.glyph}
                    </span>
                  </span>
                  <span className='tl-az-titan-name'>
                    {titan.name}
                    <span className='tl-az-titan-sphere'>{titan.sphere}</span>
                  </span>
                </span>
              ))}
            </div>
            <figcaption>
              Седемте пробудени титани бдят над спящата Азайра, душата на
              Земята.
            </figcaption>
          </figure>

          <figure className='tl-az-epochs-figure'>
            <h3 className='tl-az-subtitle'>Седемте епохи</h3>
            <ol className='tl-az-epochs'>
              {AZAIRA.epochs.map((epoch) => (
                <li
                  key={epoch.numeral}
                  className={'here' in epoch ? 'is-here' : undefined}
                >
                  <span className='tl-az-epoch-disc'>
                    <img
                      src={`/prikazki/epochs/${epoch.image}.webp`}
                      alt=''
                      width={192}
                      height={192}
                      loading='lazy'
                      decoding='async'
                    />
                    <span className='tl-az-epoch-numeral'>{epoch.numeral}</span>
                  </span>
                  <span className='tl-az-epoch-plain'>{epoch.plain}</span>
                  <span className='tl-az-epoch-name'>{epoch.name}</span>
                  {'here' in epoch && (
                    <span className='tl-az-epoch-here'>{epoch.here}</span>
                  )}
                </li>
              ))}
            </ol>
            <figcaption>
              Една спирала, седем епохи. Всяка завършва със събитие, от което се
              ражда следващата.
            </figcaption>
          </figure>
        </div>

        <div className='tl-contents tl-az-contents'>
          <h3 className='tl-contents-title'>Съдържание на света</h3>
          <ol className='tl-az-codex'>
            {AZAIRA.contents.map((item) => {
              const href = item.online
                ? canonical
                  ? `/prikazki/${canonical.slug}`
                  : undefined
                : `${ATLAS_URL}#${item.atlas}`
              const body = (
                <>
                  <span className='tl-az-codex-numeral'>{item.numeral}</span>
                  <span className='tl-az-codex-body'>
                    <span className='tl-az-codex-title'>{item.title}</span>
                    <span className='tl-az-codex-text'>{item.text}</span>
                  </span>
                </>
              )
              return (
                <li key={item.numeral}>
                  {!href ? (
                    <span className='tl-az-codex-row'>{body}</span>
                  ) : item.online ? (
                    <Link className='tl-az-codex-row' href={href}>
                      {body}
                    </Link>
                  ) : (
                    <a
                      className='tl-az-codex-row'
                      href={href}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      {body}
                    </a>
                  )}
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </section>
  )
}
