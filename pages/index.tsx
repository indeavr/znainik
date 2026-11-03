import { type GetStaticProps } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import * as React from 'react'

import { ArticleCard } from '@/components/ArticleCard'
import { Footer } from '@/components/Footer'
import { Newsletter } from '@/components/Newsletter'
import { PageHead } from '@/components/PageHead'
import { SiteHeader } from '@/components/SiteHeader'
import { loadArticles } from '@/lib/article-catalog'
import { searchArticles } from '@/lib/article-search'
import * as config from '@/lib/config'
import { site } from '@/lib/config'
import {
  type Article,
  getTagCounts,
  sortFeaturedArticles
} from '@/lib/get-articles'
import { articleArchivePath, serializeJsonLd } from '@/lib/seo'

interface HomeProps {
  articles: Article[]
  tags: Array<{ tag: string; count: number }>
}

const PAGE_SIZE = 12

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const articles = await loadArticles()
  return { props: { articles, tags: getTagCounts(articles) }, revalidate: 60 }
}

export default function HomePage({ articles, tags }: HomeProps) {
  const router = useRouter()
  const query =
    typeof router.query.q === 'string'
      ? router.query.q.trim().slice(0, 200)
      : ''
  const topic = tags.find(({ tag }) => tag === router.query.topic)?.tag ?? ''
  const requestedCount = Number(router.query.take)
  const limit = Number.isSafeInteger(requestedCount)
    ? Math.min(
        Math.max(PAGE_SIZE, requestedCount),
        Math.max(PAGE_SIZE, articles.length)
      )
    : PAGE_SIZE
  const [draft, setDraft] = React.useState(query)
  const [allTopics, setAllTopics] = React.useState(false)
  const input = React.useRef<HTMLInputElement>(null)
  const resultsHeading = React.useRef<HTMLHeadingElement>(null)
  const resultsGrid = React.useRef<HTMLDivElement>(null)
  const filtering = Boolean(query || topic)

  React.useEffect(() => setDraft(query), [query])

  const featured = React.useMemo(
    () =>
      sortFeaturedArticles(
        articles.filter((article) => article.featured)
      ).slice(0, 3),
    [articles]
  )
  const matches = React.useMemo(() => {
    const featuredIds = new Set(featured.map((article) => article.pageId))
    const candidates = articles.filter((article) =>
      filtering
        ? !topic || article.tags.includes(topic)
        : !featuredIds.has(article.pageId)
    )
    return searchArticles(candidates, query)
  }, [articles, featured, filtering, topic, query])
  const visible = matches.slice(0, limit)

  async function updateFilters(
    nextQuery: string,
    nextTopic: string,
    take = PAGE_SIZE
  ) {
    const params = { ...router.query }
    delete params.q
    delete params.topic
    delete params.take
    if (nextQuery.trim()) params.q = nextQuery.trim()
    if (nextTopic) params.topic = nextTopic
    if (take > PAGE_SIZE) params.take = String(take)
    await router.push({ pathname: '/', query: params }, undefined, {
      shallow: true,
      scroll: false
    })
  }

  async function showResults(nextQuery: string, nextTopic: string) {
    input.current?.blur()
    await updateFilters(nextQuery, nextTopic)
    requestAnimationFrame(() => {
      resultsHeading.current?.focus({ preventScroll: true })
      resultsHeading.current?.scrollIntoView({
        block: 'start',
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth'
      })
    })
  }

  async function showMore() {
    await updateFilters(query, topic, limit + PAGE_SIZE)
    requestAnimationFrame(() => {
      resultsGrid.current
        ?.querySelectorAll<HTMLAnchorElement>('.zn-card')
        [visible.length]?.focus({ preventScroll: true })
    })
  }

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: config.name,
    url: `https://${site.domain}`,
    description: config.description,
    inLanguage: 'bg'
  }

  return (
    <div className='zn-page zn-library'>
      <PageHead
        site={site}
        url={`https://${site.domain}/`}
        title='Знайник — статии за себепознание, внимание и Дао'
        description={config.description}
      />
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(websiteJsonLd) }}
      />
      <SiteHeader active='home' />

      <main className='zn-page-main'>
        <section
          className='zn-container zn-library-intro'
          aria-labelledby='library-title'
        >
          <div className='zn-library-heading'>
            <div>
              <p className='zn-library-eyebrow'>Библиотеката на Азайра</p>
              <h1 id='library-title'>
                Знайник<span aria-hidden='true'>.</span>
              </h1>
            </div>
            <p className='zn-library-intention'>
              За вниманието, творчеството
              <br className='zn-desktop-break' /> и изкуството да живеем.
            </p>
          </div>
          <form
            className='zn-library-search'
            role='search'
            aria-label='Търсене в библиотеката'
            onSubmit={(event) => {
              event.preventDefault()
              void showResults(draft, topic)
            }}
          >
            <SearchIcon />
            <label htmlFor='library-search' className='sr-only'>
              Търси по дума или тема
            </label>
            <input
              ref={input}
              id='library-search'
              type='search'
              placeholder='Търси по дума или тема…'
              autoComplete='off'
              enterKeyHint='search'
              maxLength={200}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <button type='submit'>
              Търси <span aria-hidden='true'>→</span>
            </button>
          </form>
          {tags.length > 0 && (
            <nav className='zn-library-topics' aria-label='Бърз избор на тема'>
              <div id='library-topics'>
                {(allTopics ? tags : tags.slice(0, 6)).map(({ tag }) => (
                  <button
                    key={tag}
                    type='button'
                    aria-pressed={topic === tag}
                    onClick={() =>
                      void showResults(draft, topic === tag ? '' : tag)
                    }
                  >
                    {tag}
                  </button>
                ))}
              </div>
              {tags.length > 6 && (
                <button
                  className='zn-library-topics-toggle'
                  type='button'
                  aria-expanded={allTopics}
                  aria-controls='library-topics'
                  onClick={() => setAllTopics((value) => !value)}
                >
                  {allTopics ? 'По-малко теми' : 'Всички теми'}{' '}
                  <span aria-hidden='true'>{allTopics ? '−' : '+'}</span>
                </button>
              )}
            </nav>
          )}
        </section>

        {!filtering && featured.length > 0 && (
          <section
            className='zn-container zn-library-section'
            aria-labelledby='selected-title'
          >
            <div className='zn-library-section-head'>
              <h2 id='selected-title'>Избрано за четене</h2>
              <a href='#articles' className='zn-library-text-link'>
                Към статиите <span aria-hidden='true'>↓</span>
              </a>
            </div>
            <div className='zn-library-picks' data-count={featured.length}>
              <ArticleCard article={featured[0]!} variant='lead' priority />
              {featured.length > 1 && (
                <div className='zn-library-picks-side'>
                  {featured.slice(1).map((article) => (
                    <ArticleCard
                      key={article.pageId}
                      article={article}
                      variant='compact'
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        <section
          className='zn-container zn-library-section zn-library-results'
          aria-labelledby='articles'
        >
          <div className='zn-library-section-head'>
            <div>
              <h2 id='articles' ref={resultsHeading} tabIndex={-1}>
                {query ? 'Резултати от търсенето' : topic || 'Статии'}
              </h2>
              <p className='zn-library-result-count' role='status'>
                {matches.length} {matches.length === 1 ? 'статия' : 'статии'}
                {query && <> за „{query}“</>}
              </p>
            </div>
            <div className='zn-library-filters'>
              <label>
                <span className='sr-only'>Филтрирай статиите по тема</span>
                <select
                  value={topic}
                  onChange={(event) =>
                    void showResults(draft, event.target.value)
                  }
                >
                  <option value=''>Всички теми</option>
                  {tags.map(({ tag, count }) => (
                    <option key={tag} value={tag}>
                      {tag} ({count})
                    </option>
                  ))}
                </select>
              </label>
              {filtering && (
                <button
                  type='button'
                  className='zn-library-text-link'
                  onClick={() => {
                    setDraft('')
                    void showResults('', '')
                  }}
                >
                  Изчисти
                </button>
              )}
            </div>
          </div>
          {visible.length > 0 ? (
            <div className='zn-grid zn-library-grid' ref={resultsGrid}>
              {visible.map((article) => (
                <ArticleCard
                  key={article.pageId}
                  article={article}
                  variant='catalog'
                />
              ))}
            </div>
          ) : (
            <div className='zn-library-empty'>
              <p>
                {filtering
                  ? 'Няма статии с този избор.'
                  : 'Скоро тук ще има още статии.'}
              </p>
              {filtering && (
                <>
                  <span>Опитай с друга дума или разгледай всички теми.</span>
                  <button
                    type='button'
                    onClick={() => {
                      setDraft('')
                      void showResults('', '')
                    }}
                  >
                    Разгледай библиотеката <span aria-hidden='true'>→</span>
                  </button>
                </>
              )}
            </div>
          )}
          {visible.length > 0 && (
            <div className='zn-library-pagination'>
              <span>
                Показани {visible.length} от {matches.length}
              </span>
              {visible.length < matches.length && (
                <button type='button' onClick={() => void showMore()}>
                  Покажи още <span aria-hidden='true'>↓</span>
                </button>
              )}
              <Link
                href={articleArchivePath()}
                className='zn-library-text-link'
              >
                Всички статии <span aria-hidden='true'>→</span>
              </Link>
            </div>
          )}
        </section>

        {!filtering && (
          <section
            className='zn-container zn-library-section zn-library-explore'
            aria-label='Други начини да изследваш'
          >
            <Link href='/prikazki' className='zn-library-door'>
              <div className='zn-library-door-image'>
                <Image
                  src='/story/covers/zlatnata-yabalka.png'
                  alt=''
                  fill
                  sizes='(max-width: 640px) 96px, 200px'
                />
              </div>
              <div>
                <span className='zn-library-eyebrow'>В света на историите</span>
                <h2>Приказки</h2>
                <p>Герои, избори и истории, в които участваш.</p>
                <span className='zn-library-text-link'>
                  Разгледай <span aria-hidden='true'>↗</span>
                </span>
              </div>
            </Link>
            <Link href='/dao' className='zn-library-door'>
              <div className='zn-library-door-image'>
                <Image
                  src='/dao-background.png'
                  alt=''
                  fill
                  sizes='(max-width: 640px) 96px, 200px'
                />
              </div>
              <div>
                <span className='zn-library-eyebrow'>
                  Малко пространство за размисъл
                </span>
                <h2>Дао Дъ Дзин</h2>
                <p>Стих, с който да останеш за момент.</p>
                <span className='zn-library-text-link'>
                  Отвори <span aria-hidden='true'>↗</span>
                </span>
              </div>
            </Link>
          </section>
        )}
        {!filtering && <Newsletter />}
      </main>
      <Footer />
    </div>
  )
}

function SearchIcon() {
  return (
    <svg
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
    >
      <circle cx='11' cy='11' r='7' stroke='currentColor' strokeWidth='1.6' />
      <path
        d='M21 21l-4.3-4.3'
        stroke='currentColor'
        strokeWidth='1.6'
        strokeLinecap='round'
      />
    </svg>
  )
}
