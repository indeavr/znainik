import RSS from 'rss'

import { type Article } from './get-articles'
import { canonicalUrl, isoDate } from './seo'

export function createArticleFeed(
  articles: Article[],
  site: {
    origin: string
    name: string
    description: string
    author: string
  }
): string {
  const feed = new RSS({
    title: site.name,
    description: site.description,
    site_url: site.origin,
    feed_url: `${site.origin}/feed`,
    language: 'bg',
    custom_namespaces: { media: 'http://search.yahoo.com/mrss/' },
    ttl: 30
  })
  for (const article of articles) {
    const date = isoDate(article.date)
    feed.item({
      title: article.title,
      description: article.description || article.title,
      url: canonicalUrl(`/${encodeURIComponent(article.slug)}`, site.origin),
      guid: `urn:notion:${article.pageId.replaceAll('-', '')}`,
      author: article.author || site.author,
      categories: article.tags,
      custom_elements: [
        {
          'media:content': [
            {
              _attr: {
                url:
                  article.cover ||
                  `${site.origin}/api/social-image?id=${article.pageId}`,
                medium: 'image'
              }
            }
          ]
        }
      ],
      // An empty date is omitted by rss; never manufacture a publication date.
      date: date || ''
    })
  }
  return feed.xml({ indent: true })
}
