import { type GetStaticPaths, type GetStaticProps } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { type ExtendedRecordMap } from 'notion-types'
import * as React from 'react'

import { Footer } from '@/components/Footer'
import { PageHead } from '@/components/PageHead'
import { SiteHeader } from '@/components/SiteHeader'
import { StoryExperience } from '@/components/story/StoryExperience'
import { site } from '@/lib/config'
import { loadTales } from '@/lib/get-stories-from-notion'
import { notion } from '@/lib/notion-api'
import { withNotionRetry } from '@/lib/notion-retry'
import {
  getTaleHeroes,
  getTaleNotionPageIds,
  type Hero,
  type Tale
} from '@/lib/story'

interface TaleProps {
  tale: Tale
  heroes: Hero[]
  /** Record maps for episodes that link a Notion page (keyed by episode id). */
  notionPages: Record<string, ExtendedRecordMap>
}

export const getStaticPaths: GetStaticPaths = async () => {
  const tales = await loadTales()

  return {
    paths: tales.map((tale) => ({ params: { slug: tale.slug } })),
    fallback: 'blocking'
  }
}

export const getStaticProps: GetStaticProps<TaleProps> = async ({ params }) => {
  const slug = String(params?.slug ?? '')
  const tales = await loadTales()
  const tale = tales.find((t) => t.slug === slug)

  if (!tale) {
    return { notFound: true }
  }

  const notionPages: Record<string, ExtendedRecordMap> = {}
  if (getTaleNotionPageIds(tale).length > 0) {
    for (const episode of tale.episodes) {
      if (!episode.notionPageId) continue
      try {
        notionPages[episode.id] = await withNotionRetry(() =>
          notion.getPage(episode.notionPageId!)
        )
      } catch (err) {
        console.error(
          'story: failed to fetch notion page',
          episode.notionPageId,
          err
        )
      }
    }
  }

  return {
    props: { tale, heroes: getTaleHeroes(tale), notionPages },
    revalidate: 300
  }
}

export default function TalePage({ tale, heroes, notionPages }: TaleProps) {
  const router = useRouter()
  if (router.isFallback || !tale) return null

  return (
    <div className='zn-page'>
      <PageHead
        site={site}
        title={`${tale.title} — Приказки`}
        description={tale.intro}
        image={tale.cover ? `https://${site.domain}${tale.cover}` : undefined}
      />

      <SiteHeader active='prikazki' />

      <main className='zn-page-main'>
        <section className='zn-container zn-story-top'>
          <Link href='/prikazki' className='zn-back-link'>
            ← Всички приказки
          </Link>
          <h1 className='zn-story-title'>{tale.title}</h1>
          {tale.subtitle && <p className='zn-story-subtitle'>{tale.subtitle}</p>}
          <p className='zn-story-intro'>{tale.intro}</p>
        </section>

        <section className='zn-container zn-section'>
          <StoryExperience
            tale={tale}
            heroes={heroes}
            notionPages={notionPages}
          />
        </section>
      </main>

      <Footer />
    </div>
  )
}
