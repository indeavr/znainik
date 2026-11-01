import assert from 'node:assert/strict'
import { test } from 'node:test'

import { NotionAPI } from 'notion-client'

import { ZnainikNotionAPI } from '../lib/notion-api'
import { notionRetryAfterMs, withNotionRetry } from '../lib/notion-retry'

const limited = (value: string) => ({
  status: 429,
  response: { headers: new Headers({ 'Retry-After': value }) }
})

void test('Notion cooldown reads seconds or HTTP dates and ignores malformed values', (t) => {
  t.mock.method(Date, 'now', () => Date.UTC(2026, 0, 1))
  assert.equal(notionRetryAfterMs(limited('12')), 12_000)
  assert.equal(notionRetryAfterMs(limited('0')), 0)
  assert.equal(notionRetryAfterMs(limited('-1')), undefined)
  assert.equal(
    notionRetryAfterMs(limited('Thu, 01 Jan 2026 00:00:30 GMT')),
    30_000
  )
  assert.equal(notionRetryAfterMs(limited('invalid')), undefined)
  assert.equal(notionRetryAfterMs(new Error('429')), undefined)
  assert.equal(notionRetryAfterMs(null), undefined)
})

void test('parallel build readers share request spacing; normal readers have no build delay', async (t) => {
  const previous = process.env.NEXT_PHASE
  t.after(() => {
    if (previous === undefined) delete process.env.NEXT_PHASE
    else process.env.NEXT_PHASE = previous
  })
  const waits: number[] = []
  t.mock.method(Date, 'now', () => 1000)
  t.mock.method(
    globalThis,
    'setTimeout',
    (callback: () => void, delay: number) => {
      waits.push(delay)
      queueMicrotask(callback)
      return 0
    }
  )
  t.mock.method(NotionAPI.prototype, 'fetch', async () => ({ ok: true }))
  const client = new ZnainikNotionAPI()
  process.env.NEXT_PHASE = 'phase-production-build'
  await Promise.all(
    [1, 2, 3].map(() => client.fetch({ endpoint: 'loadPageChunk', body: {} }))
  )
  assert.deepEqual(waits, [500, 1000])
  delete process.env.NEXT_PHASE
  await client.fetch({ endpoint: 'loadPageChunk', body: {} })
  assert.deepEqual(waits, [500, 1000])
})

void test('a retry respects Retry-After and returns the successful result', async (t) => {
  const waits: number[] = []
  t.mock.method(
    globalThis,
    'setTimeout',
    (callback: () => void, delay: number) => {
      waits.push(delay)
      queueMicrotask(callback)
      return 0
    }
  )
  let attempts = 0
  const result = await withNotionRetry(
    async () => {
      if (++attempts === 1) throw limited('12')
      return 'recovered'
    },
    { baseDelayMs: 1 }
  )
  assert.equal(result, 'recovered')
  assert.deepEqual(waits, [12_000])
  assert.equal(attempts, 2)
})

void test('excessive cooldowns fail without an early retry', async () => {
  let attempts = 0
  const error = limited('120')
  await assert.rejects(
    withNotionRetry(async () => {
      attempts++
      throw error
    }),
    (err) => err === error
  )
  assert.equal(attempts, 1)
})
