import type { GetServerSideProps } from 'next'

import { domain, host, rootNotionPageId } from '@/lib/config'
import {
  type Article,
  getArticlesFromRecordMap,
  getTagCounts,
  tagToSlug
} from '@/lib/get-articles'
import { loadTales } from '@/lib/get-stories-from-notion'
import { resolveNotionPage } from '@/lib/resolve-notion-page'

// Статиите идват от същото едно зареждане на корена, което ползва началната страница.
// Обхождането на целия workspace (getSiteMap) удря лимитите на Notion и връщаше 500.
async function loadArticles(): Promise<Article[]> {
  try {
    const props = await resolveNotionPage(domain)
    return getArticlesFromRecordMap(props.recordMap, rootNotionPageId)
  } catch (err) {
    console.error('sitemap: articles failed', err)
    return []
  }
}

async function loadStorySlugs(): Promise<string[]> {
  try {
    return (await loadTales()).map((t) => `prikazki/${t.slug}`)
  } catch (err) {
    console.error('sitemap: tales failed', err)
    return []
  }
}

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  if (req.method !== 'GET') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.write(JSON.stringify({ error: 'method not allowed' }))
    res.end()
    return {
      props: {}
    }
  }

  const [articles, storySlugs] = await Promise.all([
    loadArticles(),
    loadStorySlugs()
  ])

  // cache for up to 8 hours
  res.setHeader(
    'Cache-Control',
    'public, max-age=28800, stale-while-revalidate=28800'
  )
  res.setHeader('Content-Type', 'text/xml')
  res.write(createSitemap(articles, storySlugs))
  res.end()

  return {
    props: {}
  }
}

const createSitemap = (articles: Article[], storySlugs: string[]) => {
  const now = new Date().toISOString()
  const tagPaths = getTagCounts(articles).map(
    ({ tag }) => `tags/${tagToSlug(tag)}`
  )

  const url = (
    loc: string,
    priority: string,
    changefreq: string,
    lastmod = now
  ) =>
    `
      <url>
        <loc>${loc}</loc>
        <lastmod>${lastmod}</lastmod>
        <changefreq>${changefreq}</changefreq>
        <priority>${priority}</priority>
      </url>
    `.trim()

  return `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${url(host, '1.0', 'daily')}
    ${url(`${host}/prikazki`, '0.7', 'weekly')}
    ${storySlugs.map((p) => url(`${host}/${p}`, '0.7', 'weekly')).join('')}
    ${url(`${host}/tags`, '0.6', 'weekly')}
    ${tagPaths.map((p) => url(`${host}/${p}`, '0.5', 'weekly')).join('')}
    ${articles
      .map((a) =>
        url(
          `${host}/${encodeURI(a.slug)}`,
          '0.8',
          'monthly',
          a.date ? new Date(a.date).toISOString() : now
        )
      )
      .join('')}
  </urlset>
`
}

export default function noop() {
  return null
}
