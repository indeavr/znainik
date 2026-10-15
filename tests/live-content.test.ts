import assert from 'node:assert/strict'
import { test } from 'node:test'

import { contentDataUrl, LIVE_CONTENT_ROUTES } from '../lib/live-content'
import { withNotionRetry } from '../lib/notion-retry'

void test('refresh addresses share the ISR cache across query strings and hash changes', () => {
  assert.equal(contentDataUrl('build', '/'), '/_next/data/build/index.json')
  assert.equal(
    contentDataUrl('build', '/tags/%D0%B4%D0%B0%D0%BE/?q=1#top'),
    '/_next/data/build/tags/%D0%B4%D0%B0%D0%BE.json'
  )
  assert.equal(
    contentDataUrl('build', '/article#section'),
    '/_next/data/build/article.json'
  )
  assert.equal(LIVE_CONTENT_ROUTES.has('/content-calendar'), false)
  assert.equal(LIVE_CONTENT_ROUTES.has('/api/auth'), false)
})

void test('non-rate-limit errors fail immediately so ISR keeps the last good page', async () => {
  let attempts = 0
  await assert.rejects(
    withNotionRetry(async () => {
      attempts++
      throw new Error('offline')
    }),
    /offline/
  )
  assert.equal(attempts, 1)
})
