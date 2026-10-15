import assert from 'node:assert/strict'
import { test } from 'node:test'

import type { ExtendedRecordMap, PageChunk } from 'notion-types'

import { ZnainikNotionAPI } from '../lib/notion-api'

const root = '11111111-1111-1111-1111-111111111111'
const first = '22222222-2222-2222-2222-222222222222'
const second = '33333333-3333-3333-3333-333333333333'
const collection = '44444444-4444-4444-4444-444444444444'
const view = '55555555-5555-5555-5555-555555555555'

function map(block: Record<string, unknown>): ExtendedRecordMap {
  return {
    block,
    collection: {},
    collection_view: {},
    collection_query: {},
    notion_user: {},
    signed_urls: {}
  } as ExtendedRecordMap
}

function clientFor(recordMap: ExtendedRecordMap) {
  const client = new ZnainikNotionAPI()
  client.getPageRaw = async () => ({ recordMap }) as unknown as PageChunk
  return client
}

void test('an inaccessible child is fetched once, rather than looping forever', async () => {
  const client = clientFor(
    map({ [root]: { value: { id: root, type: 'page', content: [first] } } })
  )
  let calls = 0
  client.getBlocks = async () => {
    assert.ok(++calls <= 1, 'repeated request for an inaccessible block')
    return { recordMap: map({}) } as unknown as PageChunk
  }
  await client.getPage(root, { signFileUrls: false, fetchCollections: false })
  assert.equal(calls, 1)
})

void test('missing child traversal still fetches newly discovered descendants', async () => {
  const client = clientFor(
    map({ [root]: { value: { id: root, type: 'page', content: [first] } } })
  )
  const calls: string[][] = []
  client.getBlocks = async (ids) => {
    calls.push(ids)
    const id = ids[0]!
    return {
      recordMap: map({
        [id]: {
          value: { id, type: 'text', content: id === first ? [second] : [] }
        }
      })
    } as unknown as PageChunk
  }
  const result = await client.getPage(root, {
    signFileUrls: false,
    fetchCollections: false
  })
  assert.deepEqual(calls, [[first], [second]])
  assert.ok(result.block[second])
})

const collectionBlock = (id: string) => ({
  value: {
    id,
    type: 'collection_view',
    collection_id: collection,
    view_ids: [view],
    parent_table: 'block'
  }
})

for (const limit of [undefined, 1]) {
  void test(`duplicate collection views are queried only once (limit ${limit})`, async () => {
    const client = clientFor(
      map({
        [root]: { value: { id: root, type: 'page', content: [first, second] } },
        [first]: collectionBlock(first),
        [second]: collectionBlock(second)
      })
    )
    let calls = 0
    client.getCollectionData = async () => {
      calls++
      return {
        recordMap: map({}),
        result: {
          reducerResults: { collection_group_results: { blockIds: [] } }
        }
      } as never
    }
    await client.getPage(root, {
      signFileUrls: false,
      maxViewsPerCollection: limit
    })
    assert.equal(calls, 1)
  })
}

void test('strict collection failures reject instead of publishing incomplete content', async () => {
  const client = clientFor(
    map({
      [root]: {
        value: {
          id: root,
          type: 'collection_view_page',
          collection_id: collection,
          view_ids: [view]
        }
      }
    })
  )
  client.getCollectionData = async () => {
    throw new Error('upstream unavailable')
  }
  await assert.rejects(
    client.getPage(root, {
      signFileUrls: false,
      throwOnCollectionErrors: true
    }),
    /upstream unavailable/
  )
})
