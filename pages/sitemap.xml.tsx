import type { GetServerSideProps } from 'next'
import { idToUuid } from 'notion-utils'

import type { SiteMap } from '@/lib/types'
import { host, rootNotionPageId } from '@/lib/config'
import { getArticlesFromRecordMap, getTagCounts, tagToSlug } from '@/lib/get-articles'
import { getSiteMap } from '@/lib/get-site-map'
import { loadTales } from '@/lib/get-stories-from-notion'

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

  const siteMap = await getSiteMap()
  const storySlugs = (await loadTales()).map((t) => `prikazki/${t.slug}`)

  // cache for up to 8 hours
  res.setHeader(
    'Cache-Control',
    'public, max-age=28800, stale-while-revalidate=28800'
  )
  res.setHeader('Content-Type', 'text/xml')
  res.write(createSitemap(siteMap, storySlugs))
  res.end()

  return {
    props: {}
  }
}

const createSitemap = (siteMap: SiteMap, storySlugs: string[]) => {
  const lastmod = new Date().toISOString()

  // Derive tag routes from the root collection so /tags/* are indexable.
  const rootRecordMap =
    siteMap.pageMap[idToUuid(rootNotionPageId)] ?? undefined
  let tagPaths: string[] = []
  try {
    const articles = getArticlesFromRecordMap(rootRecordMap, rootNotionPageId)
    tagPaths = getTagCounts(articles).map(({ tag }) => `tags/${tagToSlug(tag)}`)
  } catch {
    tagPaths = []
  }

  const url = (
    loc: string,
    priority: string,
    changefreq: string
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
    ${Object.keys(siteMap.canonicalPageMap)
      .filter((path) => path && path !== '/')
      .map((path) => url(`${host}/${path}`, '0.8', 'weekly'))
      .join('')}
  </urlset>
`
}

export default function noop() {
  return null
}
