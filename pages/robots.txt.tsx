import type { GetServerSideProps } from 'next'

import { domain } from '@/lib/config'

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD')
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.write(JSON.stringify({ error: 'method not allowed' }))
    res.end()

    return {
      props: {}
    }
  }

  // Keep crawler directives fresh across deployment changes.
  res.setHeader('Cache-Control', 'public, max-age=3600')
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')

  // only allow the site to be crawlable on the production deployment
  if (process.env.NEXT_PUBLIC_DEPLOYMENT_ENV === 'production') {
    res.write(`User-agent: *
Allow: /
Disallow: /api/
Allow: /api/social-image

Sitemap: https://${domain}/sitemap.xml
`)
  } else {
    res.write(`User-agent: *
Disallow: /

Sitemap: https://${domain}/sitemap.xml
`)
  }

  res.end()

  return {
    props: {}
  }
}

export default function noop() {
  return null
}
