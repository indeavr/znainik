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
