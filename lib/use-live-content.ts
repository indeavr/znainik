import { useRouter } from 'next/router'
import * as React from 'react'

import {
  CONTENT_POLL_MS,
  contentDataUrl,
  LIVE_CONTENT_ROUTES
} from './live-content'

/** Refresh the shared ISR snapshot without navigation, scroll resets or remounts. */
export function useLiveContent<T extends Record<string, unknown>>(
  initialProps: T
): T {
  const router = useRouter()
  const [snapshot, setSnapshot] = React.useState<{ source: T; props: T }>()

  React.useEffect(() => {
    if (!router.isReady || !LIVE_CONTENT_ROUTES.has(router.pathname)) return

    const buildId = window.__NEXT_DATA__?.buildId
    if (!buildId) return

    let request: AbortController | undefined
    let disposed = false
    let navigating = false
    let pending = false
    let lastAttempt = 0
    let previous = JSON.stringify(initialProps)

    async function refresh() {
      if (
        disposed ||
        navigating ||
        pending ||
        document.hidden ||
        !navigator.onLine ||
        Date.now() - lastAttempt < 15_000
      )
        return

      pending = true
      lastAttempt = Date.now()
      const controller = new AbortController()
      request = controller
      const timeout = window.setTimeout(() => controller.abort(), 20_000)
      try {
        const response = await fetch(contentDataUrl(buildId!, router.asPath), {
          cache: 'no-store',
          signal: controller.signal
        })
        if (response.status === 404) {
          const missing = (await response.json()) as { notFound?: boolean }
          if (missing.notFound && !controller.signal.aborted) {
            await router.replace('/404', router.asPath, { scroll: false })
          }
          return
        }
        if (!response.ok) return
        const data = (await response.json()) as { pageProps?: T }
        if (
          !data.pageProps ||
          data.pageProps.error ||
          controller.signal.aborted
        )
          return
        const next = JSON.stringify(data.pageProps)
        if (next !== previous) {
          previous = next
          setSnapshot({ source: initialProps, props: data.pageProps })
        }
      } catch {
        // Keep the last good page while offline or while Notion is unavailable.
      } finally {
        window.clearTimeout(timeout)
        pending = false
      }
    }

    const cancel = () => {
      navigating = true
      request?.abort()
    }
    const resume = () => {
      navigating = false
    }
    const first = window.setTimeout(() => void refresh(), 1500)
    const interval = window.setInterval(() => void refresh(), CONTENT_POLL_MS)
    window.addEventListener('focus', refresh)
    window.addEventListener('online', refresh)
    document.addEventListener('visibilitychange', refresh)
    router.events.on('routeChangeStart', cancel)
    router.events.on('routeChangeComplete', resume)
    router.events.on('routeChangeError', resume)
    return () => {
      disposed = true
      cancel()
      window.clearTimeout(first)
      window.clearInterval(interval)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('online', refresh)
      document.removeEventListener('visibilitychange', refresh)
      router.events.off('routeChangeStart', cancel)
      router.events.off('routeChangeComplete', resume)
      router.events.off('routeChangeError', resume)
    }
  }, [
    initialProps,
    router.isReady,
    router.pathname,
    router.asPath,
    router.events,
    router.replace
  ])

  // A response belonging to the previous route can never replace new page props.
  return snapshot?.source === initialProps ? snapshot.props : initialProps
}
