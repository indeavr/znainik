import type { GetServerSideProps } from 'next'
import RSS from 'rss'

import { loadArticles } from '@/lib/article-catalog'
import * as config from '@/lib/config'
import { getSocialImageUrl } from '@/lib/get-social-image-url'

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  if (req.method !== 'GET') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.write(JSON.stringify({ error: 'method not allowed' }))
    res.end()
    return { props: {} }
  }

  const articles = await loadArticles()
  const ttlMinutes = 30
  const ttlSeconds = ttlMinutes * 60

  const feed = new RSS({
    title: config.name,
    site_url: config.host,
    feed_url: `${config.host}/feed.xml`,
    language: config.language,
    ttl: ttlMinutes
  })

  for (const article of articles) {
    const title = article.title || config.name
    const description = article.description || config.description
    const url = `${config.host}/${encodeURI(article.slug)}`
    const date = article.date ? new Date(article.date) : new Date()
    const socialImageUrl = getSocialImageUrl(article.pageId)

    feed.item({
      title,
      url,
      date,
      description,
      enclosure: socialImageUrl
        ? {
            url: socialImageUrl,
            type: 'image/jpeg'
          }
        : undefined
    })
  }

  const feedText = feed.xml({ indent: true })

  res.setHeader(
    'Cache-Control',
    `public, max-age=${ttlSeconds}, stale-while-revalidate=${ttlSeconds}`
  )
  res.setHeader('Content-Type', 'text/xml; charset=utf-8')
  res.write(feedText)
  res.end()

  return { props: {} }
}

export default function noop() {
  return null
}
