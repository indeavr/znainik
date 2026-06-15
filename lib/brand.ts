/**
 * Azaira / Знайник brand assets.
 *
 * Asset guide (all under /public/logo):
 * - header:        logo-symbol-big — crisp dragonfly for nav (dark tile)
 * - wordmark:      logo-sign-transparent — horizontal AZAIRA for footer
 * - icon:          logo-circle — favicon / small marks (indigo disc)
 * - appIcon:       logo-square-big — PWA / apple-touch
 * - lockup:        logo-circle-sign — symbol + AZAIRA in a circle
 */
export const brand = {
  siteName: 'Знайник',
  alt: 'Azaira Знайник',
  logos: {
    header: '/logo/logo-symbol-big.png',
    wordmark: '/logo/logo-sign-transparent.png',
    icon: '/logo/logo-circle.png',
    appIcon: '/logo/logo-square-big.png',
    lockup: '/logo/logo-circle-sign.png'
  }
} as const

export type BrandLogoVariant = keyof typeof brand.logos
