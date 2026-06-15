import { type GetStaticProps } from 'next'
import * as React from 'react'

import { Footer } from '@/components/Footer'
import { PageHead } from '@/components/PageHead'
import { SiteHeader } from '@/components/SiteHeader'
import { TagChips } from '@/components/TagChips'
import * as config from '@/lib/config'
import { domain, rootNotionPageId, site } from '@/lib/config'
import { getArticlesFromRecordMap, getTagCounts } from '@/lib/get-articles'
import { resolveNotionPage } from '@/lib/resolve-notion-page'

interface TagsIndexProps {
  tags: Array<{ tag: string; count: number }>
}

export const getStaticProps: GetStaticProps<TagsIndexProps> = async () => {
  try {
    const props = await resolveNotionPage(domain)
    const articles = getArticlesFromRecordMap(props.recordMap, rootNotionPageId)
    return { props: { tags: getTagCounts(articles) }, revalidate: 60 }
  } catch (err) {
    console.error('tags index error', err)
    throw err
  }
}

export default function TagsIndexPage({ tags }: TagsIndexProps) {
  return (
    <div className='zn-page'>
      <PageHead
        site={site}
        title={`Теми · ${config.name}`}
        description='Разгледай знанието по теми и категории.'
      />

      <SiteHeader active='tags' />

      <main className='zn-page-main'>
        <section className='zn-container zn-hero zn-tags-hero'>
          <span className='zn-hero-eyebrow'>✦ Изследвай знанието</span>
          <h1 className='zn-hero-title'>
            Всички <span className='zn-hero-gradient'>Теми</span>
          </h1>
          <p className='zn-hero-sub'>
            Намери знание по теми, които те вълнуват. Открий есенциите, които резонират с теб.
          </p>
        </section>

        <section className='zn-container zn-section'>
          {tags.length > 0 ? (
            <div className='zn-tags-grid'>
              <TagChips tags={tags} />
            </div>
          ) : (
            <p className='zn-empty'>Все още няма обозначени теми.</p>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}
