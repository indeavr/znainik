import assert from 'node:assert/strict'
import { test } from 'node:test'

import type { Block, ExtendedRecordMap } from 'notion-types'

import { pageAcl } from '../lib/acl'
import { site } from '../lib/config'
import { mapImageUrl } from '../lib/map-image-url'
import { withNotionRetry } from '../lib/notion-retry'

void test('Notion images use the working host while external and local images keep their URLs', () => {
  const block = {
    id: '11111111-1111-1111-1111-111111111111',
    parent_table: 'collection'
  } as Block
  assert.match(
    mapImageUrl('attachment:cover.png', block)!,
    /^https:\/\/app\.notion\.com\/image\//
  )
  assert.equal(
    mapImageUrl('https://images.unsplash.com/photo-test', block),
    'https://images.unsplash.com/photo-test'
  )
  assert.equal(
    mapImageUrl('/logo/logo-circle.png', block),
    '/logo/logo-circle.png'
  )
})

void test('ACL validates the requested page, not whichever record happens to be first', async () => {
  const pageId = '11111111-1111-1111-1111-111111111111'
  const recordMap = {
    block: {
      other: { value: { id: 'other', type: 'page', space_id: 'allowed' } },
      [pageId]: { value: { id: pageId, type: 'page', space_id: 'foreign' } }
    }
  } as unknown as ExtendedRecordMap
  const result = await pageAcl({
    site: { ...site, rootNotionSpaceId: 'allowed' },
    pageId,
    recordMap
  })
  assert.equal(result?.error?.statusCode, 404)
})

void test('an explicitly unpublished page is refused', async () => {
  const pageId = '11111111-1111-1111-1111-111111111111'
  const recordMap = {
    block: {
      [pageId]: {
        value: {
          id: pageId,
          type: 'page',
          parent_table: 'collection',
          parent_id: 'collection',
          properties: { public: [['No']] }
        }
      }
    },
    collection: {
      collection: {
        value: {
          id: 'collection',
          schema: { public: { name: 'Public', type: 'checkbox' } }
        }
      }
    }
  } as unknown as ExtendedRecordMap
  const result = await pageAcl({ site, pageId, recordMap })
  assert.equal(result?.error?.statusCode, 404)
})

void test('rate-limit retries remain bounded', async (t) => {
  t.mock.method(Math, 'random', () => 0)
  let attempts = 0
  await assert.rejects(
    withNotionRetry(
      async () => {
        attempts++
        throw new Error('429 Too Many Requests')
      },
      { retries: 3, baseDelayMs: 1, maxDelayMs: 1 }
    ),
    /429/
  )
  assert.equal(attempts, 3)
})
