import cs from 'classnames'
import { type GetStaticProps } from 'next'
import { Cormorant_Garamond, Forum, Kurale, Montserrat } from 'next/font/google'
import Link from 'next/link'
import * as React from 'react'

import { Footer } from '@/components/Footer'
import { PageHead } from '@/components/PageHead'
import { SiteHeader } from '@/components/SiteHeader'
import { AmbriaShowcase } from '@/components/tales/AmbriaShowcase'
import { AzairaShowcase } from '@/components/tales/AzairaShowcase'
import { FiShowcase } from '@/components/tales/FiShowcase'
import { type OnlineSeries } from '@/components/tales/OnlineLinks'
import { TaleNav, TaleShelf } from '@/components/tales/TaleShelf'
import { TvoreyaShowcase } from '@/components/tales/TvoreyaShowcase'
import { site } from '@/lib/config'
import { loadTales } from '@/lib/get-stories-from-notion'
import {
  ATLAS_URL,
  matchShowcaseTale,
  SHOWCASE_ORDER,
  type ShowcaseTaleId
} from '@/lib/tale-showcase'

// Each tale speaks in its own letters: a codex serif for „Азайра“, carved
// capitals for „Фи“, the cover's bold caps for „Творея“, a storybook face
// for „Амбриа“. All with the Cyrillic subset.
const cormorant = Cormorant_Garamond({
  subsets: ['latin', 'cyrillic'],
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-tale-codex',
  display: 'swap'
})

const forum = Forum({
  subsets: ['latin', 'cyrillic'],
  weight: '400',
  variable: '--font-tale-carved',
  display: 'swap'
})

const montserrat = Montserrat({
  subsets: ['latin', 'cyrillic'],
  weight: ['600', '800'],
  variable: '--font-tale-bold',
  display: 'swap'
})

const kurale = Kurale({
  subsets: ['latin', 'cyrillic'],
  weight: '400',
  variable: '--font-tale-story',
  display: 'swap'
})

interface PrikazkiIndexProps {
  series: Record<ShowcaseTaleId, OnlineSeries[]>
  others: OnlineSeries[]
}

export const getStaticProps: GetStaticProps<PrikazkiIndexProps> = async () => {
  const tales = await loadTales()

  const series = Object.fromEntries(
    SHOWCASE_ORDER.map((id) => [id, [] as OnlineSeries[]])
  ) as Record<ShowcaseTaleId, OnlineSeries[]>
  const others: OnlineSeries[] = []

  for (const tale of tales) {
    const item: OnlineSeries = {
      slug: tale.slug,
      title: tale.title,
      episodes: tale.episodes.length
    }
    const id = matchShowcaseTale(tale)
    if (id) series[id].push(item)
    else others.push(item)
  }

  return {
    props: { series, others },
    revalidate: 60
  }
}

export default function PrikazkiIndex({ series, others }: PrikazkiIndexProps) {
  return (
    <div
      className={cs(
        'zn-page',
        'tl-page',
        cormorant.variable,
        forum.variable,
        montserrat.variable,
        kurale.variable
      )}
    >
      <PageHead
        site={site}
        url={`https://${site.domain}/prikazki`}
        title='Приказки: Азайра, Фи, Творея и Амбриа'
        description='Четири приказки от един свят: митологията „Азайра“, „Фи“, „Творея“ и „Амбриа“. Корици, съдържание и за какво е всяка.'
        image='/prikazki/prikazki-og.jpg'
      />

      <SiteHeader active='prikazki' />

      <main className='zn-page-main'>
        <section className='zn-container tl-hero'>
          <span className='zn-hero-eyebrow'>✦ Четири приказки · един свят</span>
          <h1 className='tl-hero-title'>
            Приказките на <span className='zn-hero-gradient'>Азайра</span>
          </h1>
          <p className='tl-hero-sub'>
            Митологията на един свят и три приказки от него. Тук са кориците,
            съдържанието и за какво е всяка.
          </p>
          <TaleShelf />
        </section>

        <TaleNav />

        <AzairaShowcase online={series.azaira} />
        <FiShowcase online={series.fi} />
        <TvoreyaShowcase online={series.tvoreya} />
        <AmbriaShowcase online={series.ambria} />

        <section className='zn-container tl-outro'>
          <p className='tl-outro-text'>
            Земите, епохите и създанията на Азайра са събрани в атласа на света.
          </p>
          <a
            className='tl-btn tl-btn-primary'
            href={`${ATLAS_URL}#home`}
            target='_blank'
            rel='noopener noreferrer'
          >
            Отвори атласа <span aria-hidden='true'>↗</span>
          </a>

          {others.length > 0 && (
            <div className='tl-others'>
              <h2 className='tl-others-title'>Още за четене</h2>
              <ul>
                {others.map((item) => (
                  <li key={item.slug}>
                    <Link href={`/prikazki/${encodeURIComponent(item.slug)}`}>
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}
