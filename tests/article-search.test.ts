import assert from 'node:assert/strict'
import { test } from 'node:test'

import type { Article } from '../lib/get-articles'
import { searchArticles } from '../lib/article-search'

const article = (
  slug: string,
  title: string,
  description = '',
  tags: string[] = []
): Article => ({
  pageId: slug,
  slug,
  title,
  description,
  tags,
  cover: null,
  emoji: null,
  date: null,
  order: null,
  featured: false
})

void test('search rejects letters scattered through unrelated prose', () => {
  const articles = [
    article('noise', 'Всичко', 'Ново изкуство може да има ефект.'),
    article('focus', 'Събуди Огъня', 'Нашият огън е нашето внимание!')
  ]
  assert.deepEqual(
    searchArticles(articles, 'внимание').map((a) => a.slug),
    ['focus']
  )
})

void test('search requires every word and matches Bulgarian word beginnings', () => {
  const articles = [
    article('match', 'Силата на вниманието', '', ['Медитация']),
    article('partial', 'Силата на малката крачка'),
    article('substring', 'Недоволство', 'Пример')
  ]
  assert.deepEqual(
    searchArticles(articles, 'внимание сила').map((a) => a.slug),
    ['match']
  )
  assert.deepEqual(
    searchArticles(articles, 'сила медитац').map((a) => a.slug),
    ['match']
  )
  assert.deepEqual(searchArticles(articles, 'доволство'), [])
})

void test('exact titles outrank topic matches and description-only matches', () => {
  const articles = [
    article('body', 'Практика', 'Един текст за внимание.'),
    article('topic', 'Друг прочит', '', ['Внимание']),
    article('title', 'Внимание')
  ]
  assert.deepEqual(
    searchArticles(articles, 'внимание').map((a) => a.slug),
    ['title', 'topic', 'body']
  )
})

void test('search normalizes case and punctuation without losing Cyrillic letters', () => {
  const articles = [article('dao', 'Дао — Дъ Дзин'), article('yoga', 'Йога')]
  assert.equal(searchArticles(articles, '  ДАО-дъ   дзин! ')[0]?.slug, 'dao')
  assert.equal(searchArticles(articles, 'и\u0306ога')[0]?.slug, 'yoga')
  assert.deepEqual(searchArticles(articles, 'да'), [])
})

void test('empty queries and equal relevance preserve catalogue order without mutation', () => {
  const articles = [
    article('new', 'Медитация в движение'),
    article('old', 'Медитация в тишина')
  ]
  assert.deepEqual(searchArticles(articles, '  '), articles)
  assert.deepEqual(
    searchArticles(articles, 'медитация').map((a) => a.slug),
    ['new', 'old']
  )
  assert.deepEqual(
    articles.map((a) => a.slug),
    ['new', 'old']
  )
})
