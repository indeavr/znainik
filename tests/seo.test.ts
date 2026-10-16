import assert from 'node:assert/strict'
import { test } from 'node:test'

import { type Block, type ExtendedRecordMap } from 'notion-types'

import { type Article } from '../lib/get-articles'
import { getPageDescription } from '../lib/get-page-meta'
import { selectRelatedArticles } from '../lib/related-articles'
import { createArticleFeed } from '../lib/rss-feed'
import {
  canonicalUrl,
  createSitemapXml,
  isoDate,
  serializeJsonLd
} from '../lib/seo'

const origin = 'https://znainik.azaira.bg'
const article = (overrides: Partial<Article> = {}): Article => ({
  pageId: '1234-5678',
  slug: 'есенция',
  title: 'Есенция',
  description: '',
  cover: null,
  emoji: null,
  date: null,
  order: null,
  tags: [],
  featured: false,
  ...overrides
})

void test('canonical URLs use the public origin, preserve encoded tags and remove tracking', () => {
  assert.equal(
    canonicalUrl('/tags/дух/?utm_source=telegram#share', origin),
    `${origin}/tags/%D0%B4%D1%83%D1%85`
  )
  assert.equal(canonicalUrl('/tags/a%2Fb', origin), `${origin}/tags/a%2Fb`)
  assert.equal(
    canonicalUrl('https://preview.example/article?lite=true', origin),
    `${origin}/article`
  )
  assert.equal(canonicalUrl('/', origin), `${origin}/`)
})

void test('JSON-LD safely embeds untrusted article titles without changing their value', () => {
  const value = { headline: '</script><script>alert("x")</script>' }
  const serialized = serializeJsonLd(value)
  assert.ok(!serialized.includes('<'))
  assert.deepEqual(JSON.parse(serialized), value)
})

void test('sitemap escapes XML, deduplicates URLs and never invents modification dates', () => {
  const xml = createSitemapXml([
    { url: `${origin}/a&b` },
    { url: `${origin}/a&b` },
    { url: `${origin}/dated`, modified: Date.UTC(2026, 9, 1) },
    { url: `${origin}/invalid`, modified: Number.NaN }
  ])
  assert.equal((xml.match(/<url>/g) || []).length, 3)
  assert.equal((xml.match(/<lastmod>/g) || []).length, 1)
  assert.ok(xml.includes('/a&amp;b</loc>'))
  assert.ok(xml.includes('<lastmod>2026-10-01T00:00:00.000Z</lastmod>'))
  for (const invalid of [
    null,
    undefined,
    0,
    -1,
    Number.NaN,
    Infinity,
    1e30,
    '2026'
  ]) {
    assert.equal(isoDate(invalid), undefined)
  }
})

void test('RSS keeps stable GUIDs, Bulgarian language and undated articles without fake pubDate', () => {
  const xml = createArticleFeed(
    [
      article({ title: 'Есенция & знание', tags: ['Дух'], author: 'Автор' }),
      article({ pageId: 'another', slug: 'new', date: Date.UTC(2026, 9, 1) })
    ],
    {
      origin,
      name: 'Знайник',
      description: 'Знание',
      author: 'Автор по подразбиране'
    }
  )
  assert.ok(xml.includes(`${origin}/feed`))
  assert.ok(!xml.includes('/feed.xml'))
  assert.ok(xml.includes('<language><![CDATA[bg]]></language>'))
  assert.ok(xml.includes('urn:notion:12345678'))
  assert.ok(xml.includes('xmlns:media="http://search.yahoo.com/mrss/"'))
  assert.ok(
    xml.includes(
      '<media:content url="https://znainik.azaira.bg/api/social-image?id=1234-5678" medium="image">'
    )
  )
  assert.ok(xml.includes('<category><![CDATA[Дух]]></category>'))
  assert.ok(xml.includes('<dc:creator><![CDATA[Автор]]></dc:creator>'))
  assert.equal((xml.match(/<pubDate>/g) || []).length, 1)
  assert.ok(!xml.includes('Invalid Date'))
})

void test('related articles exclude the current UUID and prioritize actual shared topics', () => {
  const current = article({ tags: ['Дао'] })
  const related = article({ pageId: 'related', tags: ['Дао'], date: 1 })
  const newest = article({ pageId: 'newest', date: 999 })
  assert.deepEqual(
    selectRelatedArticles([current, newest, related], '12345678'),
    [related]
  )
  assert.deepEqual(selectRelatedArticles([current, newest], '12345678'), [
    newest
  ])
})

void test('missing descriptions fall back to body text, never to child-page titles', () => {
  const block = { type: 'page', content: ['child', 'body'] } as Block
  const recordMap = {
    block: {
      child: {
        value: {
          id: 'child',
          type: 'page',
          properties: { title: [['Unrelated child page']] }
        }
      },
      body: {
        value: {
          id: 'body',
          type: 'text',
          properties: { title: [['Истински текст\nот статията.']] }
        }
      }
    }
  } as unknown as ExtendedRecordMap
  assert.equal(
    getPageDescription(block, recordMap),
    'Истински текст от статията.'
  )
  assert.equal(
    getPageDescription({ type: 'page' } as Block, recordMap),
    undefined
  )
})
