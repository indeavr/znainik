import type { GetServerSideProps } from 'next'

import { loadArticles } from '@/lib/article-catalog'
import { domain } from '@/lib/config'
import { getTagCounts, tagToSlug } from '@/lib/get-articles'
import { loadTales } from '@/lib/get-stories-from-notion'
import {
  ARTICLE_ARCHIVE_PAGE_SIZE,
  articleArchivePath,
  canonicalUrl,
  createSitemapXml
} from '@/lib/seo'

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD')
    res.statusCode = 405
    res.end()
    return { props: {} }
  }

  try {
    const [articles, tales] = await Promise.all([loadArticles(), loadTales()])
    const origin = `https://${domain}`
    const paths = [
      '/',
      '/tags',
      '/prikazki',
      '/dao',
      '/oracle',
      ...Array.from(
        {
          length: Math.max(
            1,
            Math.ceil(articles.length / ARTICLE_ARCHIVE_PAGE_SIZE)
          )
        },
        (_, index) => articleArchivePath(index + 1)
      ),
      ...tales.map((tale) => `/prikazki/${encodeURIComponent(tale.slug)}`),
      ...getTagCounts(articles).map(({ tag }) => `/tags/${tagToSlug(tag)}`)
    ]
    const xml = createSitemapXml([
      ...paths.map((path) => ({ url: canonicalUrl(path, origin) })),
      ...articles.map((article) => ({
        url: canonicalUrl(`/${encodeURIComponent(article.slug)}`, origin),
        modified: article.modified
      }))
    ])
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=600, stale-while-revalidate=600'
    )
    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    res.end(req.method === 'HEAD' ? undefined : xml)
  } catch (err) {
    // Do not tell crawlers that existing pages disappeared during a Notion outage.
    console.error('sitemap: unavailable', err)
    res.statusCode = 503
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Retry-After', '60')
    res.end()
  }
  return { props: {} }
}

export default function Sitemap() {
  return null
}
