import { type GetStaticPaths, type GetStaticProps } from 'next'
import Link from 'next/link'

import { ArticleCard } from '@/components/ArticleCard'
import { Footer } from '@/components/Footer'
import { PageHead } from '@/components/PageHead'
import { SiteHeader } from '@/components/SiteHeader'
import { loadArticles } from '@/lib/article-catalog'
import { isDev, site } from '@/lib/config'
import { type Article } from '@/lib/get-articles'
import {
  ARTICLE_ARCHIVE_PAGE_SIZE,
  articleArchivePage,
  articleArchivePath,
  serializeJsonLd
} from '@/lib/seo'

interface ArchiveParams {
  page?: string[]
  [key: string]: string | string[] | undefined
}
interface ArchiveProps {
  articles: Article[]
  page: number
  pages: number
  total: number
}

export const getStaticPaths: GetStaticPaths<ArchiveParams> = async () => {
  if (isDev) return { paths: [], fallback: 'blocking' }
  const articles = await loadArticles()
  const pages = Math.max(
    1,
    Math.ceil(articles.length / ARTICLE_ARCHIVE_PAGE_SIZE)
  )
  return {
    paths: Array.from({ length: pages }, (_, i) => ({
      params: { page: i ? [String(i + 1)] : [] }
    })),
    fallback: 'blocking'
  }
}

export const getStaticProps: GetStaticProps<
  ArchiveProps,
  ArchiveParams
> = async ({ params }) => {
  const page = articleArchivePage(params?.page)
  if (page === null) return { notFound: true }
  const canonicalSegments = page === 1 ? [] : [String(page)]
  if (
    JSON.stringify(params?.page || []) !== JSON.stringify(canonicalSegments)
  ) {
    return {
      redirect: { destination: articleArchivePath(page), permanent: true }
    }
  }
  const all = await loadArticles()
  const pages = Math.max(1, Math.ceil(all.length / ARTICLE_ARCHIVE_PAGE_SIZE))
  if (page > pages) return { notFound: true, revalidate: 60 }
  return {
    props: {
      articles: all.slice(
        (page - 1) * ARTICLE_ARCHIVE_PAGE_SIZE,
        page * ARTICLE_ARCHIVE_PAGE_SIZE
      ),
      page,
      pages,
      total: all.length
    },
    revalidate: 60
  }
}

export default function ArticleArchive({
  articles,
  page,
  pages,
  total
}: ArchiveProps) {
  const origin = `https://${site.domain}`
  const url = `${origin}${articleArchivePath(page)}`
  const title =
    page === 1
      ? 'Всички статии · Знайник'
      : `Статии — страница ${page} · Знайник`
  return (
    <div className='zn-page zn-library'>
      <PageHead
        site={site}
        title={title}
        url={url}
        description={`Статии и есенции за себепознание, внимание, творчество и Дао. Разгледай библиотеката на Знайник${page > 1 ? ` — страница ${page}` : ''}.`}
      />
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: title,
            url,
            mainEntity: {
              '@type': 'ItemList',
              itemListElement: articles.map((article, index) => ({
                '@type': 'ListItem',
                position: (page - 1) * ARTICLE_ARCHIVE_PAGE_SIZE + index + 1,
                name: article.title,
                url: `${origin}/${article.slug}`
              }))
            }
          })
        }}
      />
      <SiteHeader />
      <main className='zn-page-main'>
        <header className='zn-container zn-library-intro'>
          <Link href='/' className='zn-library-text-link'>
            ← Към библиотеката
          </Link>
          <h1 className='zn-archive-title'>Статии</h1>
          <p className='zn-library-result-count'>
            {total} {total === 1 ? 'статия' : 'статии'} · Страница {page} от{' '}
            {pages}
          </p>
        </header>
        <section
          className='zn-container zn-library-section'
          aria-label='Статии от библиотеката'
        >
          <h2 className='sr-only'>Списък със статии</h2>
          <div className='zn-grid zn-library-grid'>
            {articles.map((article) => (
              <ArticleCard
                key={article.pageId}
                article={article}
                variant='catalog'
              />
            ))}
          </div>
          {pages > 1 && (
            <nav className='zn-archive-pages' aria-label='Страници със статии'>
              {page > 1 && (
                <Link href={articleArchivePath(page - 1)} rel='prev'>
                  ← Назад
                </Link>
              )}
              {Array.from({ length: pages }, (_, i) => (
                <Link
                  key={i + 1}
                  href={articleArchivePath(i + 1)}
                  aria-label={`Страница ${i + 1}`}
                  aria-current={page === i + 1 ? 'page' : undefined}
                >
                  {i + 1}
                </Link>
              ))}
              {page < pages && (
                <Link href={articleArchivePath(page + 1)} rel='next'>
                  Напред →
                </Link>
              )}
            </nav>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}
