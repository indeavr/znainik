import Head from 'next/head'
import { useRouter } from 'next/router'

import type * as types from '@/lib/types'
import * as config from '@/lib/config'
import { canonicalUrl, isoDate, serializeJsonLd } from '@/lib/seo'

/**
 * PageHead renders SEO-critical head tags for every page.
 *
 * It sets Open Graph and Twitter metadata using server-side values to ensure
 * messaging apps (e.g., Viber/Telegram) can render rich link previews without
 * relying on client-side hydration. It also handles canonical URLs and RSS.
 */
export function PageHead({
  site,
  title,
  description,
  pageId,
  image,
  url,
  isBlogPost,
  authorName,
  publishedTime,
  modifiedTime,
  noIndex = false
}: types.PageProps & {
  title?: string
  description?: string
  image?: string
  url?: string
  isBlogPost?: boolean
  authorName?: string
  publishedTime?: number | null
  modifiedTime?: number | null
  noIndex?: boolean
}) {
  const router = useRouter()
  const origin = `https://${config.domain}`
  const rssFeedUrl = `${origin}/feed`
  const canonical = canonicalUrl(url || router.asPath || '/', origin)
  const hidden =
    noIndex ||
    ['/404', '/_error'].includes(router.pathname) ||
    process.env.NEXT_PUBLIC_DEPLOYMENT_ENV !== 'production'

  title = title ?? site?.name ?? config.name
  description = description ?? site?.description ?? config.description
  const generatedImage = !image
  const socialImageUrl = image
    ? new URL(image, origin).toString()
    : `${origin}/api/social-image?id=${pageId || config.rootNotionPageId}`
  const datePublished = isoDate(publishedTime)
  const dateModified = isoDate(modifiedTime)

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${canonical}#article`,
    mainEntityOfPage: canonical,
    url: canonical,
    headline: title,
    description,
    inLanguage: 'bg',
    datePublished,
    dateModified,
    author: { '@type': 'Person', name: authorName || config.author },
    publisher: { '@type': 'Organization', name: config.name, url: origin },
    image: socialImageUrl
  }

  return (
    <Head>
      <meta charSet='utf-8' />
      <meta httpEquiv='Content-Type' content='text/html; charset=utf-8' />
      <meta
        name='viewport'
        content='width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover'
      />

      <meta name='mobile-web-app-capable' content='yes' />
      <meta name='apple-mobile-web-app-status-bar-style' content='black' />

      <meta
        name='theme-color'
        media='(prefers-color-scheme: light)'
        content='#fefffe'
        key='theme-color-light'
      />
      <meta
        name='theme-color'
        media='(prefers-color-scheme: dark)'
        content='#2d3439'
        key='theme-color-dark'
      />

      <meta
        name='robots'
        content={
          hidden
            ? 'noindex,follow'
            : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
        }
      />
      {/* Set the Open Graph type based on page context for better previews */}
      <meta property='og:type' content={isBlogPost ? 'article' : 'website'} />
      {/* Hint the page locale to scrapers for accurate title rendering */}
      <meta property='og:locale' content='bg_BG' />

      <meta property='og:site_name' content={site?.name || config.name} />
      <meta name='twitter:domain' content={config.domain} />

      {config.twitter && (
        <meta name='twitter:creator' content={`@${config.twitter}`} />
      )}

      {description && (
        <>
          <meta name='description' content={description} />
          <meta property='og:description' content={description} />
          <meta name='twitter:description' content={description} />
        </>
      )}

      {socialImageUrl ? (
        <>
          <meta name='twitter:card' content='summary_large_image' />
          <meta name='twitter:image' content={socialImageUrl} />
          <meta property='og:image' content={socialImageUrl} />
          {/* Include secure_url for HTTPS images to improve compatibility */}
          {socialImageUrl.startsWith('https://') && (
            <meta property='og:image:secure_url' content={socialImageUrl} />
          )}
          {generatedImage && <meta property='og:image:width' content='1200' />}
          {generatedImage && <meta property='og:image:height' content='630' />}
          {generatedImage && (
            <meta property='og:image:type' content='image/png' />
          )}
          <meta name='twitter:image:alt' content={title} />
        </>
      ) : (
        <meta name='twitter:card' content='summary' />
      )}

      {!hidden && (
        <>
          <link rel='canonical' href={canonical} />
          <meta property='og:url' content={canonical} />
          {/* Twitter tags use `name` rather than `property` */}
          <meta name='twitter:url' content={canonical} />
        </>
      )}

      <link
        rel='alternate'
        type='application/rss+xml'
        href={rssFeedUrl}
        title={site?.name}
      />

      <meta property='og:title' content={title} />
      <meta name='twitter:title' content={title} />
      {/* Provide alt text for social image previews where supported */}
      {socialImageUrl && <meta property='og:image:alt' content={title} />}
      <title>{title}</title>

      {isBlogPost && datePublished && (
        <meta property='article:published_time' content={datePublished} />
      )}
      {isBlogPost && dateModified && (
        <meta property='article:modified_time' content={dateModified} />
      )}
      {isBlogPost && !hidden && (
        <script
          key='breadcrumb-schema'
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Начало',
                  item: `${origin}/`
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: title,
                  item: canonical
                }
              ]
            })
          }}
        />
      )}
      {isBlogPost && !hidden && (
        <script
          key='article-schema'
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleSchema) }}
        />
      )}
    </Head>
  )
}
