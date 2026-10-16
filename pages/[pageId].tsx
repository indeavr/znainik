import { type GetStaticProps } from 'next'

import { NotionPage } from '@/components/NotionPage'
import { loadArticles } from '@/lib/article-catalog'
import { domain, isDev, pageUrlOverrides } from '@/lib/config'
import { selectRelatedArticles } from '@/lib/related-articles'
import { resolveNotionPage } from '@/lib/resolve-notion-page'
import { type PageProps, type Params } from '@/lib/types'

export const getStaticProps: GetStaticProps<PageProps, Params> = async (
  context
) => {
  const rawPageId = context.params?.pageId as string

  try {
    const props = await resolveNotionPage(domain, rawPageId)

    if (props.error?.statusCode === 404)
      return { notFound: true, revalidate: 60 }
    // Include recommendations in the initial HTML so crawlers and readers see them immediately.
    try {
      props.relatedArticles = selectRelatedArticles(
        await loadArticles(),
        props.pageId || rawPageId
      )
    } catch {
      // Optional recommendations must not prevent publishing a readable article.
    }
    return { props, revalidate: 30 }
  } catch (err) {
    console.error('page error', domain, rawPageId, err)

    // we don't want to publish the error version of this page, so
    // let next.js know explicitly that incremental SSG failed
    throw err
  }
}

export async function getStaticPaths() {
  // Use blocking fallback so the first request returns fully rendered HTML
  // with PageHead meta tags (critical for crawlers and previews).
  // In dev and prod, this ensures SSR on initial access.
  if (isDev) {
    return {
      paths: [],
      fallback: 'blocking'
    }
  }

  const articles = await loadArticles()

  // Combine sitemap paths with URL overrides (e.g., /articles, /notes)
  // URL overrides might not be in the sitemap if not directly linked from root
  const allPageIds = [
    ...new Set([
      ...articles.map((article) => article.slug),
      ...Object.keys(pageUrlOverrides)
    ])
  ]

  const staticPaths = {
    paths: allPageIds.map((pageId) => ({ params: { pageId } })),
    fallback: 'blocking'
  }

  return staticPaths
}

export default function NotionDomainDynamicPage(props: PageProps) {
  return <NotionPage {...props} />
}
