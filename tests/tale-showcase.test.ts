import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

import {
  AMBRIA,
  AZAIRA,
  COURSE_URLS,
  COVERS,
  FI,
  matchShowcaseTale,
  SHELF,
  SHOWCASE_ORDER,
  TVOREYA
} from '../lib/tale-showcase'

// Tests run from the repo root (`pnpm test`).
const publicDir = path.join(process.cwd(), 'public')

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(strings)
  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(strings)
  }
  return []
}

const ALL_TEXT = strings({ AZAIRA, FI, TVOREYA, AMBRIA, SHELF, COVERS })

void test('Notion series are linked from the right tale', () => {
  assert.equal(
    matchShowcaseTale({
      slug: 'azaira-priklyucheniya',
      title: 'Азайра — Приключенията'
    }),
    'azaira'
  )
  assert.equal(
    matchShowcaseTale({
      slug: 'tvoreya-raztvori-se',
      title: 'Творея — Раз‑Твори се'
    }),
    'tvoreya'
  )
  assert.equal(matchShowcaseTale({ slug: 'fi-kniga-parva', title: 'Фи' }), 'fi')
  assert.equal(matchShowcaseTale({ slug: 'ambria', title: 'Амбриа' }), 'ambria')
  assert.equal(
    matchShowcaseTale({ slug: 'filosofiya', title: 'Философия на пътя' }),
    null
  )
  assert.equal(
    matchShowcaseTale({ slug: 'zlatnata-yabalka', title: 'Златната ябълка' }),
    null
  )
})

void test('the four tales are on the shelf in order, each with a cover', () => {
  assert.deepEqual(
    SHELF.map((tale) => tale.id),
    SHOWCASE_ORDER
  )
  for (const id of SHOWCASE_ORDER) {
    assert.ok(COVERS[id].alt.length > 20, `${id} cover needs alt text`)
  }
})

void test('every picture on the page exists in public/', () => {
  const images = [
    ...Object.values(COVERS).flatMap((cover) => [cover.small, cover.large]),
    ...FI.scenes.map((scene) => scene.image),
    ...AMBRIA.scenes.map((scene) => scene.image),
    ...AZAIRA.epochs.map((epoch) => `/prikazki/epochs/${epoch.image}.webp`),
    ...AZAIRA.titans.map((titan) => `/prikazki/titans/${titan.id}.webp`),
    '/prikazki/titans/azaira.webp',
    ...TVOREYA.mentors.map((mentor) => `/prikazki/mentors/${mentor.id}.webp`),
    '/prikazki/prikazki-og.jpg'
  ]
  for (const image of images) {
    assert.ok(existsSync(path.join(publicDir, image)), `missing ${image}`)
  }
})

void test('no names borrowed from other works', () => {
  // Flagged in the print notes of „Фи“ and „Творея“ (World of Warcraft,
  // „Шанара“, the TV series „Колелото на времето“).
  const banned = [
    /Кирин/u,
    /Аланон/u,
    /Асшар/u,
    /Вечния Цъфтеж/u,
    /Разцепван/u,
    /Наару/u,
    /Легион/u,
    /Шанар/u,
    /Колелото на времето/u,
    /(^|[^\p{L}])Ша([^\p{L}]|$)/u,
    /Етритре|Еритре/u
  ]
  for (const text of ALL_TEXT) {
    for (const pattern of banned) {
      assert.doesNotMatch(text, pattern)
    }
  }
})

void test('the page links only to the courses, never to the atlas', () => {
  for (const text of ALL_TEXT) {
    assert.doesNotMatch(text, /svyat/u)
  }
  assert.equal(COURSE_URLS.fi, 'https://azaira.bg/phi/pauza')
  assert.equal(COURSE_URLS.tvoreya, 'https://azaira.bg/raz-tvori-se')
})

void test('no page counts, prices or dates the sources do not agree on', () => {
  for (const text of ALL_TEXT) {
    assert.doesNotMatch(text, /\d+\s*(стр\.|страниц)/u)
    assert.doesNotMatch(text, /\d+\s*(лв|лева|евро|€)/u)
    assert.doesNotMatch(text, /ISBN/u)
  }
})
