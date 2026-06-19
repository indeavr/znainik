import { type GetStaticProps } from 'next'
import Link from 'next/link'
import * as React from 'react'

import { ArticleCard } from '@/components/ArticleCard'
import { BrandLogo } from '@/components/BrandLogo'
import { openCommandPalette } from '@/components/CommandPalette'
import { Footer } from '@/components/Footer'
import { Newsletter } from '@/components/Newsletter'
import { PageHead } from '@/components/PageHead'
import { SiteHeader } from '@/components/SiteHeader'
import { TagChips } from '@/components/TagChips'
import * as config from '@/lib/config'
import { domain, rootNotionPageId, site } from '@/lib/config'
import {
  type Article,
  getArticlesFromRecordMap,
  getTagCounts,
  sortFeaturedArticles
} from '@/lib/get-articles'
import { resolveNotionPage } from '@/lib/resolve-notion-page'

interface HomeProps {
  articles: Article[]
  tags: Array<{ tag: string; count: number }>
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  try {
    const props = await resolveNotionPage(domain)
    const articles = getArticlesFromRecordMap(props.recordMap, rootNotionPageId)
    const tags = getTagCounts(articles)

    return {
      props: { articles, tags },
      revalidate: 60
    }
  } catch (err) {
    console.error('home page error', domain, err)
    throw err
  }
}

export default function HomePage({ articles, tags }: HomeProps) {
  const featured = sortFeaturedArticles(articles.filter((a) => a.featured)).slice(
    0,
    3
  )

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: config.name,
    url: `https://${site.domain}`,
    description: config.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: `https://${site.domain}/tags/{search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  }

  return (
    <div className='zn-page'>
      <PageHead site={site} title={config.name} description={config.description} />
      <script
        type='application/ld+json'
         
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      <SiteHeader active='home' />

      <main className='zn-page-main'>
        <section className='zn-container zn-hero'>
          <span className='zn-hero-aura' aria-hidden='true' />
          <span className='zn-hero-eyebrow'>
            <span className='zn-hero-eyebrow-dot' aria-hidden='true' />
            Жива библиотека от знание
          </span>
          <h1 className='zn-hero-title'>
            Знайник —{' '}
            <span className='zn-hero-gradient'>
              Есенции
              <span className='zn-hero-spark' aria-hidden='true'>
                ✦
              </span>
            </span>
          </h1>
          <p className='zn-hero-sub'>{config.description}</p>

          <div className='zn-hero-search'>
            <button
              type='button'
              className='zn-hero-cta'
              onClick={openCommandPalette}
            >
              <SearchIcon />
              <span>Търси из Есенциите…</span>
              <span className='zn-kbd' style={{ marginLeft: 'auto' }}>
                ⌘K
              </span>
            </button>
          </div>
        </section>

        <section className='zn-container zn-section'>
          <Link href='/prikazki' className='zn-story-banner'>
            <span className='zn-story-banner-glow' aria-hidden='true' />
            <span className='zn-story-banner-badge' aria-hidden='true'>
              <BrandLogo variant='lockup' />
            </span>
            <span className='zn-story-banner-body'>
              <span className='zn-story-banner-eyebrow'>Нова приказка-игра</span>
              <span className='zn-story-banner-title'>
                Влез в интерактивните Приказки
              </span>
              <span className='zn-story-banner-sub'>
                Прелистай епизодите и опознай героите.
              </span>
            </span>
            <span className='zn-story-banner-cta'>
              Започни
              <span className='zn-story-banner-arrow' aria-hidden='true'>
                →
              </span>
            </span>
          </Link>
        </section>

        {tags.length > 0 && (
          <section className='zn-container zn-section'>
            <div className='zn-section-head'>
              <h2 className='zn-section-title'>Разгледай по теми</h2>
              <a className='zn-section-link' href='/tags'>
                Всички теми →
              </a>
            </div>
            <TagChips tags={tags.slice(0, 16)} />
          </section>
        )}

        {featured.length > 0 && (
          <section className='zn-container zn-section'>
            <div className='zn-section-head'>
              <h2 className='zn-section-title'>Препоръчани</h2>
            </div>
            <div className='zn-grid'>
              {featured.map((article) => (
                <ArticleCard key={article.pageId} article={article} />
              ))}
            </div>
          </section>
        )}

        <section className='zn-container zn-section'>
          <div className='zn-section-head'>
            <h2 className='zn-section-title'>
              {featured.length ? 'Последни Есенции' : 'Всички Есенции'}
            </h2>
          </div>

          {articles.length > 0 ? (
            <div className='zn-grid'>
              {articles.map((article) => (
                <ArticleCard key={article.pageId} article={article} />
              ))}
            </div>
          ) : (
            <p className='zn-empty'>Скоро тук ще има съдържание.</p>
          )}
        </section>

        <Newsletter />
      </main>

      <Footer />
    </div>
  )
}

function SearchIcon() {
  return (
    <svg width='20' height='20' viewBox='0 0 24 24' fill='none' aria-hidden='true'>
      <circle cx='11' cy='11' r='7' stroke='currentColor' strokeWidth='2' />
      <path
        d='M21 21l-4.3-4.3'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}
