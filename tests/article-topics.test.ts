import assert from 'node:assert/strict'
import { test } from 'node:test'

import { getLegacyTopic, getTagIcon } from '../lib/tags'

void test('old topic links resolve after renaming, including Cyrillic and slash slugs', () => {
  for (const [old, current] of [
    ['Love', 'Любов и отношения'],
    ['AI', 'Технологии и съзнание'],
    ['sufism', 'Суфизъм'],
    ['ДАО', 'Даоизъм'],
    ['нещата-от-живота', 'Себепознание'],
    ['древни-знания', 'Даоизъм'],
    ['творчество/креативност', 'Творчество'],
    ['фокус', 'Внимание и медитация'],
    ['образование', 'Учене и образование'],
    ['история', 'Приказки и символи']
  ]) {
    assert.equal(getLegacyTopic(old!), current)
    assert.equal(getLegacyTopic(encodeURIComponent(old!)), current)
  }
})

void test('current topics and arbitrary slugs do not create redirect loops', () => {
  for (const topic of [
    'Даоизъм',
    'Себепознание',
    'Творчество',
    'Нова тема',
    '%',
    '__proto__'
  ]) {
    assert.equal(getLegacyTopic(topic), undefined)
  }
})

void test('renamed topics retain their artwork', () => {
  assert.equal(getTagIcon('Даоизъм'), getTagIcon('ДАО'))
  assert.equal(getTagIcon('Любов и отношения'), getTagIcon('Love'))
  assert.equal(getTagIcon('Технологии и съзнание'), getTagIcon('AI'))
  assert.equal(getTagIcon('Приказки и символи'), '/tags/history.png')
  assert.equal(getTagIcon('Нова тема'), '/tags/default.png')
})
