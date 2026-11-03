/** Canonicals always use the public origin, without tracking/query fragments. */
export function canonicalUrl(path: string, origin: string): string {
  const url = new URL(path, origin)
  const canonical = new URL(origin)
  canonical.pathname = url.pathname
  canonical.pathname = canonical.pathname.replace(/\/+$/, '') || '/'
  return canonical.toString()
}

export function isoDate(value: unknown): string | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0)
    return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

/** Search snippets use compact prose; the full editorial excerpt stays in cards. */
export function seoDescription(value: string, maxLength = 180): string {
  const text = value.replaceAll(/\s+/g, ' ').trim()
  if (text.length <= maxLength) return text
  const opening = text.slice(0, maxLength - 1)
  const sentence = [...opening.matchAll(/[.!?](?=\s|$)/g)].at(-1)?.index
  if (sentence !== undefined && sentence >= maxLength * 0.55) {
    return opening.slice(0, sentence + 1)
  }
  const wordBoundary = opening.lastIndexOf(' ')
  return `${opening.slice(0, wordBoundary > 0 ? wordBoundary : opening.length).trimEnd()}…`
}

export const ARTICLE_ARCHIVE_PAGE_SIZE = 12

export function articleArchivePath(page = 1): string {
  return page === 1 ? '/statii' : `/statii/${page}`
}

/** Stable, crawlable pages; never silently replace an invalid page with page one. */
export function articleArchivePage(
  segments: string[] | undefined
): number | null {
  if (!segments?.length) return 1
  if (segments.length !== 1 || !/^\d+$/.test(segments[0]!)) return null
  const page = Number(segments[0])
  return Number.isSafeInteger(page) && page > 0 ? page : null
}

/** Prevent Notion text from terminating a JSON-LD script element. */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replaceAll('<', '\\u003c')
}

export function escapeXml(value: string): string {
  return value.replaceAll(
    /[<>&"']/g,
    (char) =>
      ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&apos;'
      })[char]!
  )
}

export function createSitemapXml(
  entries: Array<{ url: string; modified?: number | null }>
): string {
  const seen = new Set<string>()
  const urls = entries
    .filter(({ url }) => {
      if (seen.has(url)) return false
      seen.add(url)
      return true
    })
    .map(({ url, modified }) => {
      const date = isoDate(modified)
      return `<url><loc>${escapeXml(url)}</loc>${date ? `<lastmod>${date}</lastmod>` : ''}</url>`
    })
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`
}
