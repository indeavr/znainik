import assert from 'node:assert/strict'
import { test } from 'node:test'

import { permanentFileUrl } from '../lib/map-image-url'

test('signed file links become permanent attachment addresses', () => {
  const signed =
    'https://file.notion.com/f/f/a4e2eff3-9fda-4c77-a752-c23e8306a35e/328e969c-e340-4523-ae44-6256346a01f0/generated-image-1781180389051.png?table=block&id=23247a99&spaceId=a4e2&expirationTimestamp=1794326&signature=abc'
  assert.equal(
    permanentFileUrl(signed),
    'attachment:328e969c-e340-4523-ae44-6256346a01f0:generated-image-1781180389051.png'
  )
})

test('other images stay as they are', () => {
  for (const url of [
    'attachment:877fec9d-c96f-45c0-8b4e-4cb52b306dcc:ai.png',
    'https://www.notion.so/images/page-cover/hudsonRiverSchool_lakeGeorge.jpg',
    'https://images.unsplash.com/photo-1.jpg'
  ]) {
    assert.equal(permanentFileUrl(url), url)
  }
})
