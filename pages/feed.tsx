import type { GetServerSideProps } from 'next'

import { loadArticles } from '@/lib/article-catalog'
import * as config from '@/lib/config'
import { createArticleFeed } from '@/lib/rss-feed'

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405
    res.setHeader('Allow', 'GET, HEAD')
    res.end()
    return { props: {} }
  }
  try {
    const articles = await loadArticles()
    const xml = createArticleFeed(articles, {
      ...config,
      origin: `https://${config.domain}`
    })
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=1800, stale-while-revalidate=1800'
    )
    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8')
    res.end(req.method === 'HEAD' ? undefined : xml)
  } catch (err) {
    console.error('feed: unavailable', err)
    res.statusCode = 503
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Retry-After', '60')
    res.end()
  }
  return { props: {} }
}

export default function Feed() {
  return null
}
