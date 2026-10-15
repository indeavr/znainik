/** Only public ISR pages participate; forms and authenticated routes do not. */
export const LIVE_CONTENT_ROUTES = new Set([
  '/',
  '/[pageId]',
  '/tags',
  '/tags/[tag]',
  '/prikazki',
  '/prikazki/[slug]',
  '/oracle'
])

export const CONTENT_POLL_MS = 30_000

/** Next's Pages Router serves the same ISR snapshot as HTML and navigation JSON. */
export function contentDataUrl(buildId: string, asPath: string): string {
  const pathname = asPath.split(/[?#]/)[0]!.replace(/\/$/, '') || '/'
  return `/_next/data/${encodeURIComponent(buildId)}${pathname === '/' ? '/index' : pathname}.json`
}
