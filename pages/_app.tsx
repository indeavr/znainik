import 'katex/dist/katex.min.css' // used for rendering equations (optional)
import 'prismjs/themes/prism-coy.css' // used for code syntax highlighting (optional)
// import 'prismjs/themes/prism-okaidia.css' // this might be better for dark mode
import 'react-notion-x/src/styles.css' // core styles shared by all of react-notion-x (required)
import 'styles/theme.css' // brand design tokens (must load before notion overrides)
import 'styles/global.css' // global styles shared across the entire site
import 'styles/notion.css' // global style overrides for notion
import 'styles/prism-theme.css' // global style overrides for prism theme (optional)
import 'styles/site.css' // marketing / knowledge-base UI (home, tags, palette, etc.)
import 'styles/story.css' // interactive story-game experience (приказки)

import type { AppProps } from 'next/app'
import { IconContext } from '@react-icons/all-files'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import cs from 'classnames'
import * as Fathom from 'fathom-client'
import { Inter, Lora } from 'next/font/google'
import { useRouter } from 'next/router'
import { posthog } from 'posthog-js'
import * as React from 'react'

import { CommandPalette } from '@/components/CommandPalette'
import { ReadingProgress } from '@/components/ReadingProgress'
import { ScrollToTop } from '@/components/ScrollToTop'
import { bootstrap } from '@/lib/bootstrap-client'
import {
  fathomConfig,
  fathomId,
  isServer,
  posthogConfig,
  posthogId
} from '@/lib/config'

// Cyrillic-first typography: a clean sans for UI/reading and an elegant serif
// for headings, both self-hosted by next/font with the Cyrillic subset.
const fontSans = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700']
})

const fontSerif = Lora({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-serif',
  display: 'swap',
  weight: ['500', '600', '700']
})

// Only run bootstrap on client side
if (!isServer) {
  bootstrap()
}

// Using function declaration style to fix ESLint error
function App({ Component, pageProps }: AppProps) {
  const router = useRouter()

  React.useEffect(() => {
    function onRouteChangeComplete() {
      if (fathomId) {
        Fathom.trackPageview()
      }

      if (posthogId) {
        posthog.capture('$pageview')
      }
    }

    if (fathomId) {
      Fathom.load(fathomId, fathomConfig)
    }

    if (posthogId) {
      posthog.init(posthogId, posthogConfig)
    }

    router.events.on('routeChangeComplete', onRouteChangeComplete)

    return () => {
      router.events.off('routeChangeComplete', onRouteChangeComplete)
    }
  }, [router.events])

  return (
    <IconContext.Provider value={{ style: { verticalAlign: 'middle' } }}>
      <div className={cs('app-root', fontSans.variable, fontSerif.variable)}>
        <ReadingProgress />
        <Component {...pageProps} />
        <CommandPalette />
        <ScrollToTop />
        <SpeedInsights />
        <Analytics />
      </div>
    </IconContext.Provider>
  )
}

export default App
