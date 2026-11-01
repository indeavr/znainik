import assert from 'node:assert/strict'
import { test } from 'node:test'

import { type Block, type ExtendedRecordMap } from 'notion-types'

import { withArticleExcerpts } from '../lib/article-catalog-excerpts'
import { articleOpening } from '../lib/article-excerpt'
import { type Article } from '../lib/get-articles'
import { getPageDescription } from '../lib/get-page-meta'

const record = (id: string, type: string, text = '', content?: string[]) => ({
  value: { id, type, properties: { title: [[text]] }, content }
})
const map = (blocks: Record<string, unknown>) =>
  ({ block: blocks }) as ExtendedRecordMap
const article = (pageId: string, description = '') =>
  ({ pageId, description, modified: 1 }) as Article

void test('opening excerpts preserve reading order through columns and omit captions and linked pages', () => {
  const records = map({
    image: record('image', 'image', 'Caption'),
    heading: record('heading', 'header', 'Heading'),
    page: record('page', 'page', 'Other page', ['private']),
    private: record('private', 'text', 'Never excerpt linked pages'),
    columns: record('columns', 'column_list', '', ['column']),
    column: record('column', 'column', '', ['body']),
    body: record('body', 'text', 'Първи ред.\n Второ изречение.'),
    end: record('end', 'quote', 'Още текст.')
  })
  const root = {
    content: ['image', 'heading', 'page', 'columns', 'end']
  } as Block
  assert.equal(
    articleOpening(root, records).excerpt,
    'Първи ред. Второ изречение. Още текст.'
  )
  assert.deepEqual(articleOpening(root, records).missing, [])
})

void test('long prose is shortened on a word boundary and empty bodies remain empty', () => {
  const root = { content: ['body'] } as Block
  const text = 'Дълго изречение с цели думи. '.repeat(30)
  const { excerpt } = articleOpening(
    root,
    map({ body: record('body', 'text', text) })
  )
  assert.ok(excerpt.length <= 240)
  assert.ok(excerpt.endsWith('…'))
  assert.ok(text.startsWith(excerpt.slice(0, -1)))
  assert.equal(
    getPageDescription({ content: [] } as unknown as Block, map({})),
    undefined
  )
})

void test('catalogue enrichment batches only missing public article openings and invalidates changed revisions', async () => {
  const articles = [
    article('edited', '  Authored description  '),
    article('first'),
    article('second')
  ]
  const records = map({
    edited: record('edited', 'page', '', ['do-not-fetch']),
    first: record('first', 'page', '', ['a']),
    second: record('second', 'page', '', ['b']),
    hidden: record('hidden', 'page', '', ['secret'])
  })
  const batches: string[][] = []
  const read = async (ids: string[]) => {
    batches.push(ids)
    return Object.fromEntries(
      ids.map((id) => [id, record(id, 'text', `Opening ${id}`)])
    ) as ExtendedRecordMap['block']
  }
  const result = await withArticleExcerpts(articles, records, read)
  assert.deepEqual(batches, [['a', 'b']])
  assert.deepEqual(
    result.map((row) => row.description),
    ['  Authored description  ', 'Opening a', 'Opening b']
  )
  await withArticleExcerpts(articles, map({}), read)
  assert.equal(batches.length, 1)
  await withArticleExcerpts(
    [{ ...articles[1]!, modified: 2 }],
    map({ first: records.block.first }),
    read
  )
  assert.equal(batches.length, 2)
})

void test('failed body reads are retried, not cached as empty descriptions', async () => {
  const records = map({ retry: record('retry', 'page', '', ['body']) })
  const articles = [article('retry')]
  await assert.rejects(
    withArticleExcerpts(articles, records, async () => {
      throw new Error('Notion unavailable')
    })
  )
  const result = await withArticleExcerpts(
    articles,
    records,
    async () =>
      map({ body: record('body', 'text', 'Recovered opening.') }).block
  )
  assert.equal(result[0]!.description, 'Recovered opening.')
})

void test('a partial record map never substitutes a later paragraph for the opening', () => {
  const records = map({ later: record('later', 'text', 'Later paragraph.') })
  const root = { content: ['opening', 'later'] } as Block
  assert.equal(articleOpening(root, records).excerpt, '')
  assert.deepEqual(articleOpening(root, records).missing, ['opening'])
  assert.equal(getPageDescription(root, records), undefined)
})
