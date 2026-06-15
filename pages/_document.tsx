import Document, { Head, Html, Main, NextScript } from 'next/document'

import { brand } from '../lib/brand'

export default class MyDocument extends Document {
  override render() {
    const icon = brand.logos.icon
    const appIcon = brand.logos.appIcon

    return (
      <Html lang='bg'>
        <Head>
          <link rel='shortcut icon' href={icon} />
          <link rel='icon' type='image/png' sizes='32x32' href={icon} />
          <link rel='icon' type='image/png' sizes='16x16' href={icon} />
          <link rel='icon' type='image/png' sizes='128x128' href={icon} />
          <link rel='icon' type='image/png' sizes='180x180' href={appIcon} />
          <link rel='icon' type='image/png' sizes='512x512' href={appIcon} />

          <link rel='manifest' href='/manifest.json' />

          <link rel='preconnect' href='https://fonts.googleapis.com' />
          <link
            rel='preconnect'
            href='https://fonts.gstatic.com'
            crossOrigin='anonymous'
          />

          <link rel='preload' href={icon} as='image' />

          <link rel='apple-touch-icon' href={appIcon} />
          <link rel='apple-touch-icon' sizes='180x180' href={appIcon} />

          <script src='https://t.contentsquare.net/uxa/9f0e11a01d357.js' />
        </Head>

        <body>
          <script
            dangerouslySetInnerHTML={{
              __html: `
/** Inlined version of noflash.js from use-dark-mode */
;(function () {
  var storageKey = 'darkMode'
  var classNameDark = 'dark-mode'
  var classNameLight = 'light-mode'
  function setClassOnDocumentBody(darkMode) {
    document.body.classList.add(darkMode ? classNameDark : classNameLight)
    document.body.classList.remove(darkMode ? classNameLight : classNameDark)
  }
  var preferDarkQuery = '(prefers-color-scheme: dark)'
  var mql = window.matchMedia(preferDarkQuery)
  var supportsColorSchemeQuery = mql.media === preferDarkQuery
  var localStorageTheme = null
  try {
    localStorageTheme = localStorage.getItem(storageKey)
  } catch (err) {}
  var localStorageExists = localStorageTheme !== null
  if (localStorageExists) {
    localStorageTheme = JSON.parse(localStorageTheme)
  }
  // Determine the source of truth
  if (localStorageExists) {
    // source of truth from localStorage
    setClassOnDocumentBody(localStorageTheme)
  } else if (supportsColorSchemeQuery) {
    // source of truth from system
    setClassOnDocumentBody(mql.matches)
    localStorage.setItem(storageKey, mql.matches)
  } else {
    // source of truth from document.body
    var isDarkMode = document.body.classList.contains(classNameDark)
    localStorage.setItem(storageKey, JSON.stringify(isDarkMode))
  }
})();
`
            }}
          />
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
