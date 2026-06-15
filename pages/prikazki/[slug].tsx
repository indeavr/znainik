import { type GetStaticPaths, type GetStaticProps } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { type ExtendedRecordMap } from 'notion-types'
import * as React from 'react'
import { NotionRenderer } from 'react-notion-x'

import { Footer } from '@/components/Footer'
import { PageHead } from '@/components/PageHead'
import { SiteHeader } from '@/components/SiteHeader'
import { HeroTags } from '@/components/story/HeroTags'
import { StoryExperience } from '@/components/story/StoryExperience'
import { site } from '@/lib/config'
import { loadTales } from '@/lib/get-stories-from-notion'
import { notion } from '@/lib/notion-api'
import { withNotionRetry } from '@/lib/notion-retry'
import { type Tale } from '@/lib/story'
import { findCanonicalNotionPageId } from '@/lib/story-canonical'
import { useDarkMode } from '@/lib/use-dark-mode'

interface TaleProps {
  tale: Tale
  notionPages: Record<string, ExtendedRecordMap>
  canonicalPage: ExtendedRecordMap | null
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
  let canonicalPage: ExtendedRecordMap | null = null

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

  if (tale.notionPageId) {
    try {
      const talePage = await withNotionRetry(() =>
        notion.getPage(tale.notionPageId!)
      )
      const canonicalId = findCanonicalNotionPageId(talePage, tale.notionPageId!)
      if (canonicalId) {
        const episodeMatch = tale.episodes.find(
          (ep) => ep.notionPageId === canonicalId
        )
        canonicalPage =
          (episodeMatch && notionPages[episodeMatch.id]) ||
          (await withNotionRetry(() => notion.getPage(canonicalId)))
      }
    } catch (err) {
      console.error('story: failed to resolve canonical page', tale.notionPageId, err)
    }
  }

  return {
    props: {
      tale,
      notionPages,
      canonicalPage
    },
    revalidate: 300
  }
}

function CanonicalBody({ recordMap }: { recordMap: ExtendedRecordMap }) {
  const { isDarkMode } = useDarkMode()
  return (
    <div className='zn-story-notion zn-story-canonical notion'>
      <NotionRenderer
        recordMap={recordMap}
        fullPage={false}
        darkMode={isDarkMode}
      />
    </div>
  )
}

export default function TalePage({
  tale,
  notionPages,
  canonicalPage
}: TaleProps) {
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
          {tale.intro && !canonicalPage && (
            <p className='zn-story-intro'>{tale.intro}</p>
          )}
          <HeroTags slugs={tale.heroSlugs} />
        </section>

        {canonicalPage && (
          <section className='zn-container zn-section zn-story-canonical-wrap'>
            <CanonicalBody recordMap={canonicalPage} />
          </section>
        )}

        <section className='zn-container zn-section'>
          <StoryExperience tale={tale} notionPages={notionPages} />
        </section>
      </main>

      <Footer />
    </div>
  )
}
