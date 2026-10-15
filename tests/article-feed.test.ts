import assert from 'node:assert/strict'
import { test } from 'node:test'

import { fetchArticleFeed } from '../lib/article-feed'

void test('feed retries failures, shares concurrent reads and expires successful results', async (t) => {
  let calls = 0
  let fail = true
  t.mock.method(globalThis, 'fetch', async () => {
    calls++
    return new Response(
      JSON.stringify(fail ? { error: 'unavailable' } : { articles: [] }),
      { status: fail ? 503 : 200 }
    )
  })
  await assert.rejects(fetchArticleFeed(), /unavailable/)
  fail = false
  const [a, b] = await Promise.all([fetchArticleFeed(), fetchArticleFeed()])
  assert.deepEqual(a, [])
  assert.equal(a, b)
  assert.equal(calls, 2)
  await fetchArticleFeed()
  assert.equal(calls, 2)
  const later = Date.now() + 31_000
  t.mock.method(Date, 'now', () => later)
  await fetchArticleFeed()
  assert.equal(calls, 3)
})
