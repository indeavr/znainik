import { type GetStaticProps } from 'next'
import Link from 'next/link'
import * as React from 'react'

import { Footer } from '@/components/Footer'
import { PageHead } from '@/components/PageHead'
import { SiteHeader } from '@/components/SiteHeader'
import { site } from '@/lib/config'
import { loadTales } from '@/lib/get-stories-from-notion'
import { type Tale } from '@/lib/story'

interface PrikazkiIndexProps {
  tales: Tale[]
}

export const getStaticProps: GetStaticProps<PrikazkiIndexProps> = async () => {
  const tales = await loadTales()

  return {
    props: { tales },
    revalidate: 300
  }
}

export default function PrikazkiIndex({ tales }: PrikazkiIndexProps) {
  return (
    <div className='zn-page'>
      <PageHead
        site={site}
        title='Приказки — интерактивни истории'
        description='Интерактивни приказки с епизоди и кодекс на героите.'
      />

      <SiteHeader active='prikazki' />

      <main className='zn-page-main'>
        <section className='zn-container zn-hero zn-story-hero'>
          <span className='zn-hero-eyebrow'>✦ Интерактивни приказки</span>
          <h1 className='zn-hero-title'>
            Приказки, които <span className='zn-hero-gradient'>оживяват</span>
          </h1>
          <p className='zn-hero-sub'>
            Прелистай епизодите и опознай героите.
          </p>
        </section>

        <section className='zn-container zn-section'>
          {tales.length === 0 ? (
            <p className='zn-empty-state'>Очаквайте скоро</p>
          ) : (
            <div className='zn-story-tales'>
              {tales.map((tale) => (
                <Link
                  key={tale.id}
                  href={`/prikazki/${tale.slug}`}
                  className='zn-tale-card'
                >
                  <span className='zn-tale-cover'>
                    {tale.cover ? (
                      <img src={tale.cover} alt={tale.title} loading='lazy' />
                    ) : (
                      <span className='zn-tale-cover-fallback'>📖</span>
                    )}
                  </span>
                  <span className='zn-tale-body'>
                    <span className='zn-tale-title'>{tale.title}</span>
                    {tale.subtitle && (
                      <span className='zn-tale-subtitle'>{tale.subtitle}</span>
                    )}
                    <span className='zn-tale-meta'>
                      {tale.episodes.length} епизода · {tale.heroIds.length} герои
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}
