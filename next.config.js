import path from 'node:path'
import { fileURLToPath } from 'node:url'

import bundleAnalyzer from '@next/bundle-analyzer'

// Disable analyzer toggling via environment to avoid linter issues.
const withBundleAnalyzer = bundleAnalyzer({ enabled: false })

/**
 * Next.js config factory.
 *
 * Avoids direct `process.env` usage to satisfy lint rules and uses
 * phase-aware configuration to select a writable dist directory in dev
 * and the default `.next` in other phases (compatible with Vercel).
 */
/**
 * Creates the Next.js configuration based on the current phase.
 *
 * - Uses a writable `distDir` in development to avoid permission issues.
 * - Falls back to `.next` for other phases, keeping Vercel compatibility.
 */
const createNextConfig = (phase) =>
  withBundleAnalyzer({
    staticPageGenerationTimeout: 300,
    // Use a writable distDir in development to avoid local permission issues,
    // default to `.next` in other phases for Vercel compatibility.
    distDir: phase === 'phase-development-server' ? '.next-dev-writable-1' : '.next',
    images: {
      remotePatterns: [
        { protocol: 'https', hostname: 'www.notion.so' },
        { protocol: 'https', hostname: 'notion.so' },
        { protocol: 'https', hostname: 'images.unsplash.com' },
        { protocol: 'https', hostname: 'abs.twimg.com' },
        { protocol: 'https', hostname: 'pbs.twimg.com' },
        { protocol: 'https', hostname: 's3.us-west-2.amazonaws.com' }
      ],
      formats: ['image/avif', 'image/webp'],
      dangerouslyAllowSVG: true,
      contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
    },

    webpack: (config) => {
      // Workaround for ensuring that `react` and `react-dom` resolve correctly
      // when using a locally-linked version of `react-notion-x`.
      // @see https://github.com/vercel/next.js/issues/50391
      const dirname = path.dirname(fileURLToPath(import.meta.url))
      config.resolve.alias.react = path.resolve(dirname, 'node_modules/react')
      config.resolve.alias['react-dom'] = path.resolve(
        dirname,
        'node_modules/react-dom'
      )
      return config
    },

    // See https://react-tweet.vercel.app/next#troubleshooting
    transpilePackages: ['react-tweet']
  })

export default createNextConfig
