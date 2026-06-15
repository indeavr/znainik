import { type GetStaticPaths, type GetStaticProps } from 'next'
import Link from 'next/link'
import * as React from 'react'

import { ArticleCard } from '@/components/ArticleCard'
import { Footer } from '@/components/Footer'
import { PageHead } from '@/components/PageHead'
import { SiteHeader } from '@/components/SiteHeader'
import * as config from '@/lib/config'
import { domain, isDev, rootNotionPageId, site } from '@/lib/config'
import {
  type Article,
  getArticlesFromRecordMap,
  getTagCounts,
  slugToTagMatcher,
  tagToSlug
} from '@/lib/get-articles'
import { resolveNotionPage } from '@/lib/resolve-notion-page'
import { getTagIcon } from '@/lib/tags'

interface TagPageProps {
  tag: string
  articles: Article[]
}

interface TagParams {
  tag: string
  [key: string]: string | string[] | undefined
}

export const getStaticPaths: GetStaticPaths<TagParams> = async () => {
  if (isDev) {
    return { paths: [], fallback: 'blocking' }
  }

  try {
    const props = await resolveNotionPage(domain)
    const articles = getArticlesFromRecordMap(props.recordMap, rootNotionPageId)
    const tags = getTagCounts(articles)
    return {
      paths: tags.map(({ tag }) => ({ params: { tag: tagToSlug(tag) } })),
      fallback: 'blocking'
    }
  } catch (err) {
    console.error('tag paths error', err)
    return { paths: [], fallback: 'blocking' }
  }
}

export const getStaticProps: GetStaticProps<TagPageProps, TagParams> = async (
  context
) => {
  const slug = context.params?.tag as string

  try {
    const props = await resolveNotionPage(domain)
    const articles = getArticlesFromRecordMap(props.recordMap, rootNotionPageId)
    const matches = slugToTagMatcher(slug)

    const matched = articles.filter((a) => a.tags.some((t) => matches(t)))
    if (matched.length === 0) {
      return { notFound: true, revalidate: 60 }
    }

    // Display name: the actual tag label as written in Notion.
    const tag =
      matched[0]?.tags.find((t) => matches(t)) ?? decodeURIComponent(slug)

    return { props: { tag, articles: matched }, revalidate: 60 }
  } catch (err) {
    console.error('tag page error', slug, err)
    throw err
  }
}

export default function TagPage({ tag, articles }: TagPageProps) {
  return (
    <div className='zn-page'>
      <PageHead
        site={site}
        title={`${tag} · ${config.name}`}
        description={`Есенции по темата „${tag}“.`}
      />

      <SiteHeader active='tags' />

      <main className='zn-page-main'>
        <section className='zn-container zn-hero zn-tags-hero'>
          <span className='zn-hero-eyebrow'>
            <Link href='/tags' className='zn-back-link' style={{ marginBottom: 0 }}>
              ← Всички теми
            </Link>
          </span>
          <h1 className='zn-hero-title zn-tag-title'>
            <span className='zn-tag-title-icon'>
              <img src={getTagIcon(tag)} alt={tag} />
            </span>
            {tag}
          </h1>
          <p className='zn-hero-sub'>
            {articles.length}{' '}
            {articles.length === 1 ? 'есенция' : 'есенции'} по тази тема
          </p>
        </section>

        <section className='zn-container zn-section'>
          <div className='zn-grid'>
            {articles.map((article) => (
              <ArticleCard key={article.pageId} article={article} />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
