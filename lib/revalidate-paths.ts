import { type NextApiResponse } from 'next'

import { domain, pageUrlOverrides, rootNotionPageId } from './config'
import {
  getArticlesFromRecordMap,
  getTagCounts,
  tagToSlug
} from './get-articles'
import { loadTales } from './get-stories-from-notion'
import { resolveNotionPage } from './resolve-notion-page'

/** Listing / hub routes — refreshed by `path=all` (no full sitemap crawl). */
export const SHELL_PATHS = [
  '/',
  '/tags',
  '/prikazki',
  '/oracle'
] as const

export type RevalidateResult = {
  path: string
  ok: boolean
  error?: string
}

export async function revalidatePaths(
  res: NextApiResponse,
  paths: string[],
  concurrency = 2
): Promise<RevalidateResult[]> {
  const unique = [...new Set(paths.filter(Boolean))]
  const results: RevalidateResult[] = []

  for (let i = 0; i < unique.length; i += concurrency) {
    const chunk = unique.slice(i, i + concurrency)
    const settled = await Promise.allSettled(
      chunk.map(async (path) => {
        await res.revalidate(path)
        return path
      })
    )

    chunk.forEach((path, j) => {
      const s = settled[j]
      if (!s) {
        results.push({ path, ok: false, error: 'No result' })
        return
      }
      if (s.status === 'fulfilled') {
        results.push({ path, ok: true })
        return
      }
      const message =
        s.reason instanceof Error ? s.reason.message : String(s.reason)
      console.error('revalidate path', path, message)
      results.push({ path, ok: false, error: message })
    })
  }

  return results
}

/** Fast paths for `path=all` — home, tags, prikazki (+ tale detail pages). */
export async function collectShellPaths(): Promise<string[]> {
  const paths = new Set<string>([
    ...SHELL_PATHS,
    ...Object.keys(pageUrlOverrides).map((slug) => `/${slug}`)
  ])

  try {
    const tales = await loadTales()
    for (const tale of tales) {
      paths.add(`/prikazki/${tale.slug}`)
    }
  } catch (err) {
    console.warn('collectShellPaths: loadTales failed', err)
  }

  return [...paths]
}

/** Article slugs from the root Notion collection (one fetch, not full sitemap). */
export async function collectArticlePaths(): Promise<string[]> {
  const props = await resolveNotionPage(domain)
  const articles = getArticlesFromRecordMap(props.recordMap, rootNotionPageId)
  const paths = new Set<string>(
    articles.map((article) => `/${article.slug}`)
  )

  for (const slug of Object.keys(pageUrlOverrides)) {
    paths.add(`/${slug}`)
  }

  return [...paths]
}

/** Tag listing pages from the root collection. */
export async function collectTagPaths(): Promise<string[]> {
  const props = await resolveNotionPage(domain)
  const articles = getArticlesFromRecordMap(props.recordMap, rootNotionPageId)
  const tags = getTagCounts(articles)
  return tags.map(({ tag }) => `/tags/${tagToSlug(tag)}`)
}

export function parseExtraPaths(raw: string | undefined): string[] {
  if (!raw?.trim()) return []
  return raw
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => (p.startsWith('/') ? p : `/${p}`))
}
