// Core React and Next.js imports
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import * as React from 'react'

// Third-party libraries
import * as Fathom from 'fathom-client'
import { IconContext } from '@react-icons/all-files'
import posthog from 'posthog-js'
import { SpeedInsights } from '@vercel/speed-insights/next'

// Project imports
import { bootstrap } from '@/lib/bootstrap-client'
import {
  fathomConfig,
  fathomId,
  isServer,
  posthogConfig,
  posthogId
} from '@/lib/config'

// Styles
import 'katex/dist/katex.min.css' // used for rendering equations (optional)
import 'prismjs/themes/prism-coy.css' // used for code syntax highlighting (optional)
import 'react-notion-x/src/styles.css' // core styles shared by all of react-notion-x (required)
import 'styles/global.css' // global styles shared across the entire site
// import 'prismjs/themes/prism-okaidia.css' // this might be better for dark mode
import 'styles/notion.css' // global style overrides for notion
import 'styles/prism-theme.css' // global style overrides for prism theme (optional)

// Create a client-side only component wrapper
const ClientOnly = ({ children }) => {
  const [hasMounted, setHasMounted] = React.useState(false)
  
  React.useEffect(() => {
    setHasMounted(true)
  }, [])
  
  if (!hasMounted) {
    return null
  }
  
  return <>{children}</>
}

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
      <ClientOnly>
        <Component {...pageProps} />
        <SpeedInsights />
      </ClientOnly>
    </IconContext.Provider>
  )
}

export default App
