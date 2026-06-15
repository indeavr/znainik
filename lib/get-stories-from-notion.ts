import { type Block, type Collection, type ExtendedRecordMap } from 'notion-types'
import {
  getBlockTitle,
  getPageProperty,
  getTextContent,
  parsePageId
} from 'notion-utils'
import pMemoize from 'p-memoize'

import {
  isDev,
  storiesEpisodesCollectionId,
  storiesNotionPageId,
  storiesTalesCollectionId
} from './config'
import { getCanonicalPageId } from './get-canonical-page-id'
import { getNotionBlockValue, getNotionCollectionValue } from './get-notion-block-value'
import { mapImageUrl } from './map-image-url'
import { notion } from './notion-api'
import { normalizeNotionApiRecordMap } from './notion-record-map'
import { withNotionRetry } from './notion-retry'
import { type Episode, type Tale } from './story'
import { parseHeroSlugs } from './story-heroes'

type SchemaProp = Collection['schema'][string]

const PUBLIC_PROPS = ['Public', 'Публично', 'Published', 'Публикувано']
const ORDER_PROPS = ['Order', 'Ред', '#', 'Episode', 'Епизод', 'Номер']
const SUMMARY_PROPS = ['Summary', 'Резюме', 'Описание', 'Teaser', 'Кратко']
const ICON_PROPS = ['Icon', 'Икона', 'icon', 'Фаза', 'Емоджи']
const SUBTITLE_PROPS = ['Subtitle', 'Подзаглавие']
const INTRO_PROPS = ['Intro', 'Въведение', 'Description', 'Описание']
const COVER_PROPS = ['Cover', 'Корица', 'cover']
const HERO_PROPS = ['Heroes', 'Герои', 'HeroIds', 'heroIds']
const TALE_KEY_PROPS = [
  'Tale',
  'Приказка',
  'Story',
  'История',
  'Tale Slug',
  'Приказка slug'
]

interface TaleDraft {
  id: string
  slug: string
  title: string
  subtitle?: string
  cover?: string
  intro: string
  heroSlugs: string[]
  notionPageId?: string
  order: number | null
}

interface EpisodeDraft extends Episode {
  order: number | null
  taleIds: string[]
  taleKey: string | null
}

function toNotionUuid(id: string): string {
  const bare = id.replaceAll('-', '')
  return parsePageId(bare, { uuid: true }) ?? id
}

function firstStringProperty(
  names: string[],
  block: Block,
  recordMap: ExtendedRecordMap
): string {
  for (const name of names) {
    const value = getPageProperty<string>(name, block, recordMap)
    if (value && String(value).trim()) {
      return String(value).trim()
    }
  }
  return ''
}

function firstNumberProperty(
  names: string[],
  block: Block,
  recordMap: ExtendedRecordMap
): number | null {
  for (const name of names) {
    const value = getPageProperty<number>(name, block, recordMap)
    if (typeof value === 'number' && !Number.isNaN(value)) {
      return value
    }
  }
  return null
}

function isPublicPage(block: Block, recordMap: ExtendedRecordMap): boolean {
  for (const name of PUBLIC_PROPS) {
    const value = getPageProperty<boolean | string | null>(name, block, recordMap)
    if (value === false) return false
    if (typeof value === 'string' && value.toLowerCase() === 'no') return false
  }
  return true
}

function getCollectionSchema(
  recordMap: ExtendedRecordMap,
  collectionId: string
): Record<string, SchemaProp> {
  return getNotionCollectionValue(recordMap.collection?.[toNotionUuid(collectionId)])?.schema ?? {}
}

function findPropertyName(
  schema: Record<string, SchemaProp>,
  {
    names,
    type
  }: {
    names?: string[]
    type?: string
  }
): string | undefined {
  const props = Object.values(schema)
  if (names) {
    for (const name of names) {
      const found = props.find((p) => p.name === name)
      if (found) return found.name
    }
  }
  if (type) {
    const found = props.find((p) => p.type === type)
    if (found) return found.name
  }
  return undefined
}

function collectCollectionIds(recordMap: ExtendedRecordMap): Set<string> {
  const ids = new Set<string>()

  for (const id of Object.keys(recordMap.collection_query ?? {})) {
    ids.add(toNotionUuid(id))
  }
  for (const id of Object.keys(recordMap.collection ?? {})) {
    ids.add(toNotionUuid(id))
  }
  for (const raw of Object.values(recordMap.block ?? {})) {
    const block = getNotionBlockValue(raw)
    if (block?.parent_table === 'collection' && block.parent_id) {
      ids.add(toNotionUuid(block.parent_id))
    }
  }

  return ids
}

function getCollectionName(
  recordMap: ExtendedRecordMap,
  collectionId: string
): string {
  const raw = getNotionCollectionValue(recordMap.collection?.[toNotionUuid(collectionId)])?.name
  if (!raw) return ''
  return getTextContent(raw).toLowerCase()
}

function detectStoryCollections(recordMap: ExtendedRecordMap): {
  episodesCollectionId: string
  talesCollectionId: string | null
} {
  const collectionIds = collectCollectionIds(recordMap)

  let episodesCollectionId = storiesEpisodesCollectionId
  let talesCollectionId = storiesTalesCollectionId

  if (episodesCollectionId) {
    episodesCollectionId = toNotionUuid(episodesCollectionId)
  }
  if (talesCollectionId) {
    talesCollectionId = toNotionUuid(talesCollectionId)
  }

  if (!episodesCollectionId) {
    for (const cid of collectionIds) {
      const name = getCollectionName(recordMap, cid)
      if (
        name.includes('епизод') ||
        name.includes('episode') ||
        name.includes('глава') ||
        name.includes('chapter')
      ) {
        episodesCollectionId = cid
        break
      }
    }
  }

  if (!episodesCollectionId) {
    for (const cid of collectionIds) {
      const schema = getCollectionSchema(recordMap, cid)
      if (findPropertyName(schema, { type: 'relation' })) {
        episodesCollectionId = cid
        break
      }
    }
  }

  if (!episodesCollectionId && collectionIds.size === 1) {
    episodesCollectionId = [...collectionIds][0]!
  }

  if (!episodesCollectionId) {
    throw new Error(
      'Could not detect episodes database on stories hub page. Set storiesEpisodesCollectionId in site.config.ts.'
    )
  }

  if (!talesCollectionId) {
    for (const cid of collectionIds) {
      if (cid === episodesCollectionId) continue
      const name = getCollectionName(recordMap, cid)
      if (
        name.includes('приказ') ||
        name.includes('tale') ||
        name.includes('story') ||
        name.includes('истори')
      ) {
        talesCollectionId = cid
        break
      }
    }
  }

  return { episodesCollectionId, talesCollectionId }
}

function getCollectionPageIds(
  recordMap: ExtendedRecordMap,
  collectionId: string
): string[] {
  const cq = recordMap.collection_query?.[toNotionUuid(collectionId)]
  const ids = new Set<string>()

  if (cq) {
    for (const viewData of Object.values(cq)) {
      const blockIds =
        (viewData as { blockIds?: string[] })?.blockIds ||
        (
          viewData as {
            collection_group_results?: { blockIds?: string[] }
          }
        )?.collection_group_results?.blockIds ||
        []
      for (const id of blockIds) {
        ids.add(toNotionUuid(id))
      }
    }
  }

  if (!ids.size) {
    for (const raw of Object.values(recordMap.block ?? {})) {
      const block = getNotionBlockValue(raw)
      if (
        block?.type === 'page' &&
        block.parent_table === 'collection' &&
        toNotionUuid(block.parent_id) === toNotionUuid(collectionId)
      ) {
        ids.add(toNotionUuid(block.id))
      }
    }
  }

  return [...ids]
}

function parseHeroSlugsFromBlock(
  block: Block,
  recordMap: ExtendedRecordMap
): string[] {
  for (const name of HERO_PROPS) {
    const value = getPageProperty<string | string[]>(name, block, recordMap)
    const slugs = parseHeroSlugs(value)
    if (slugs.length) return slugs
  }
  return []
}

function resolveCover(block: Block, recordMap: ExtendedRecordMap): string | undefined {
  const coverRaw =
    block.format?.page_cover || firstStringProperty(COVER_PROPS, block, recordMap)
  if (!coverRaw) return undefined
  return mapImageUrl(coverRaw, block) ?? undefined
}

function episodeIcon(block: Block, recordMap: ExtendedRecordMap): string {
  const fromProp = firstStringProperty(ICON_PROPS, block, recordMap)
  const raw = fromProp || block.format?.page_icon || '📖'
  if (raw.startsWith('http') || raw.startsWith('/')) {
    return '📖'
  }
  return raw
}

function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replaceAll(/[^\p{L}\p{N}]+/gu, '-')
    .replaceAll(/^-|-$/g, '')
}

function extractRelationPageIds(
  block: Block,
  recordMap: ExtendedRecordMap,
  propName: string | undefined
): string[] {
  if (!propName || !block.properties) return []

  const collection = getNotionCollectionValue(
    recordMap.collection?.[block.parent_id]
  )?.schema
  if (!collection) return []

  const propertyId = Object.keys(collection).find(
    (key) => collection[key]?.name === propName
  )
  if (!propertyId) return []

  const decorations = block.properties[propertyId]
  if (!Array.isArray(decorations)) return []

  const pageIds: string[] = []
  for (const decoration of decorations) {
    if (!Array.isArray(decoration) || decoration.length < 2) continue
    if (decoration[0] !== '‣') continue
    const pagePointer = (decoration[1] as unknown[] | undefined)?.[0]
    if (
      Array.isArray(pagePointer) &&
      pagePointer.length > 1 &&
      pagePointer[0] === 'p' &&
      typeof pagePointer[1] === 'string'
    ) {
      pageIds.push(toNotionUuid(pagePointer[1]))
    }
  }
  return pageIds
}

function getRelationPageIds(
  block: Block,
  recordMap: ExtendedRecordMap,
  propName: string | undefined
): string[] {
  const fromRelation = extractRelationPageIds(block, recordMap, propName)
  if (fromRelation.length) return fromRelation

  if (!propName) return []
  const value = getPageProperty<string[] | string>(propName, block, recordMap)
  if (Array.isArray(value)) {
    return value.map((id) => toNotionUuid(id)).filter(Boolean)
  }
  if (typeof value === 'string' && value) {
    const parsed = parsePageId(value, { uuid: true })
    return parsed ? [parsed] : []
  }
  return []
}

function parseTaleDraft(
  block: Block,
  recordMap: ExtendedRecordMap
): TaleDraft | null {
  if (!isPublicPage(block, recordMap)) return null

  const title = getBlockTitle(block, recordMap)?.trim()
  if (!title) return null

  const slug =
    getCanonicalPageId(block.id, recordMap, { uuid: false }) ?? slugifyTitle(title)

  const intro =
    firstStringProperty(INTRO_PROPS, block, recordMap) ||
    firstStringProperty(SUMMARY_PROPS, block, recordMap) ||
    ''

  return {
    id: toNotionUuid(block.id),
    slug,
    title,
    subtitle: firstStringProperty(SUBTITLE_PROPS, block, recordMap) || undefined,
    cover: resolveCover(block, recordMap),
    intro,
    heroSlugs: parseHeroSlugsFromBlock(block, recordMap),
    notionPageId: toNotionUuid(block.id),
    order: firstNumberProperty(ORDER_PROPS, block, recordMap)
  }
}

function parseEpisodeDraft(
  block: Block,
  recordMap: ExtendedRecordMap,
  taleRelationProp: string | undefined
): EpisodeDraft | null {
  if (!isPublicPage(block, recordMap)) return null

  const title = getBlockTitle(block, recordMap)?.trim()
  if (!title) return null

  const slug =
    getCanonicalPageId(block.id, recordMap, { uuid: false }) ?? slugifyTitle(title)

  const taleKey =
    firstStringProperty(TALE_KEY_PROPS, block, recordMap).toLowerCase() || null

  return {
    id: slug,
    title,
    icon: episodeIcon(block, recordMap),
    summary: firstStringProperty(SUMMARY_PROPS, block, recordMap) || undefined,
    notionPageId: toNotionUuid(block.id),
    heroes: parseHeroSlugsFromBlock(block, recordMap),
    order: firstNumberProperty(ORDER_PROPS, block, recordMap),
    taleIds: getRelationPageIds(block, recordMap, taleRelationProp),
    taleKey
  }
}

const STORY_PAGE_OPTIONS = {
  fetchCollections: true,
  fetchRelationPages: true,
  concurrency: 1,
  collectionReducerLimit: 999
} as const

function mergeRecordMaps(...maps: ExtendedRecordMap[]): ExtendedRecordMap {
  const merged: ExtendedRecordMap = {
    block: {},
    collection: {},
    collection_view: {},
    collection_query: {},
    notion_user: {},
    signed_urls: {}
  }

  for (const recordMap of maps) {
    merged.block = { ...merged.block, ...recordMap.block }
    merged.collection = { ...merged.collection, ...recordMap.collection }
    merged.collection_view = {
      ...merged.collection_view,
      ...recordMap.collection_view
    }
    merged.notion_user = { ...merged.notion_user, ...recordMap.notion_user }
    merged.signed_urls = { ...merged.signed_urls, ...recordMap.signed_urls }

    for (const [collectionId, views] of Object.entries(
      recordMap.collection_query ?? {}
    )) {
      merged.collection_query![collectionId] = {
        ...merged.collection_query![collectionId],
        ...views
      }
    }
  }

  normalizeNotionApiRecordMap(merged)
  return merged
}

async function getCollectionParentPageId(
  collectionId: string
): Promise<string | null> {
  const response = (await withNotionRetry(() =>
    notion.fetch({
      endpoint: 'syncRecordValuesMain',
      body: {
        requests: [{ table: 'collection', id: collectionId, version: -1 }]
      }
    })
  )) as {
    recordMap?: { collection?: Record<string, { value?: unknown }> }
  }

  const collection = getNotionCollectionValue(
    response.recordMap?.collection?.[collectionId]
  )
  const parentId = collection?.parent_id
  if (!parentId || collection?.parent_table !== 'block') {
    return null
  }
  return toNotionUuid(parentId)
}

async function fetchStoryDatabasePage(
  collectionId: string
): Promise<ExtendedRecordMap | null> {
  const pageId = await getCollectionParentPageId(collectionId)
  if (!pageId) {
    if (isDev) {
      console.warn(
        `story: could not resolve parent page for collection ${collectionId}`
      )
    }
    return null
  }

  return withNotionRetry(() => notion.getPage(pageId, STORY_PAGE_OPTIONS))
}

async function fetchStoriesRecordMapFromCollections(): Promise<ExtendedRecordMap | null> {
  const talesCollectionId = storiesTalesCollectionId
    ? toNotionUuid(storiesTalesCollectionId)
    : null
  const episodesCollectionId = storiesEpisodesCollectionId
    ? toNotionUuid(storiesEpisodesCollectionId)
    : null

  if (!episodesCollectionId) {
    return null
  }

  const collectionIds = [
    episodesCollectionId,
    talesCollectionId && talesCollectionId !== episodesCollectionId
      ? talesCollectionId
      : null
  ].filter(Boolean) as string[]

  const maps = (
    await Promise.all(collectionIds.map((id) => fetchStoryDatabasePage(id)))
  ).filter(Boolean) as ExtendedRecordMap[]

  if (!maps.length) {
    return null
  }

  return mergeRecordMaps(...maps)
}

/**
 * Loads the stories hub page (with embedded episode / tale databases).
 * Falls back to the published full-page databases when only collection IDs
 * are configured.
 * Memoized for the duration of a build step.
 */
export const fetchStoriesRecordMap = pMemoize(
  async (): Promise<ExtendedRecordMap | null> => {
    if (storiesNotionPageId) {
      const pageId = storiesNotionPageId
      return withNotionRetry(() => notion.getPage(pageId, STORY_PAGE_OPTIONS))
    }

    return fetchStoriesRecordMapFromCollections()
  }
)

/**
 * Builds tale + episode trees from the stories hub record map.
 *
 * Expected Notion setup:
 * - A hub page (`storiesNotionPageId`) with linked views of your databases.
 * - Episodes DB: each row is a chapter; page body = episode content.
 * - Optional Tales DB: metadata (title, intro, cover, heroes). Episodes link via Relation.
 * - If tale pages are regular Notion pages (not a DB), publish them and link via Relation.
 */
export function getTalesFromRecordMap(recordMap: ExtendedRecordMap): Tale[] {
  const { episodesCollectionId, talesCollectionId } =
    detectStoryCollections(recordMap)

  const episodesSchema = getCollectionSchema(recordMap, episodesCollectionId)
  const taleRelationProp = findPropertyName(episodesSchema, { type: 'relation' })

  const taleDrafts = new Map<string, TaleDraft>()

  if (talesCollectionId) {
    for (const pageId of getCollectionPageIds(recordMap, talesCollectionId)) {
      const block = getNotionBlockValue(recordMap.block[pageId])
      if (!block) continue
      const draft = parseTaleDraft(block, recordMap)
      if (draft) taleDrafts.set(draft.id, draft)
    }
  }

  const episodeDrafts: EpisodeDraft[] = []
  for (const pageId of getCollectionPageIds(recordMap, episodesCollectionId)) {
    const block = getNotionBlockValue(recordMap.block[pageId])
    if (!block) continue
    const episode = parseEpisodeDraft(block, recordMap, taleRelationProp)
    if (episode) episodeDrafts.push(episode)
  }

  for (const episode of episodeDrafts) {
    for (const taleId of episode.taleIds) {
      if (taleDrafts.has(taleId)) continue
      const block = getNotionBlockValue(recordMap.block[taleId])
      if (!block) continue
      const draft = parseTaleDraft(block, recordMap)
      if (draft) taleDrafts.set(draft.id, draft)
    }
  }

  const talesByKey = new Map<string, TaleDraft>()
  for (const draft of taleDrafts.values()) {
    talesByKey.set(draft.slug, draft)
    talesByKey.set(draft.id, draft)
  }

  const grouped = new Map<string, EpisodeDraft[]>()

  for (const episode of episodeDrafts) {
    let taleKey: string | null = null

    if (episode.taleIds.length > 0) {
      taleKey = episode.taleIds[0]!
    } else if (episode.taleKey) {
      const match =
        talesByKey.get(episode.taleKey) ??
        [...talesByKey.values()].find(
          (t) =>
            t.slug === episode.taleKey ||
            t.title.toLowerCase() === episode.taleKey
        )
      taleKey = match?.id ?? `key:${episode.taleKey}`
    }

    if (!taleKey) {
      if (isDev) {
        console.warn(
          `story: episode "${episode.title}" has no tale relation — skipped`
        )
      }
      continue
    }

    if (!grouped.has(taleKey)) {
      grouped.set(taleKey, [])
    }
    grouped.get(taleKey)!.push(episode)
  }

  const tales: Tale[] = []

  for (const [taleKey, episodes] of grouped) {
    const draft =
      taleDrafts.get(taleKey) ??
      [...taleDrafts.values()].find((t) => t.slug === taleKey) ??
      (taleKey.startsWith('key:')
        ? {
            id: taleKey,
            slug: taleKey.slice(4),
            title: taleKey.slice(4),
            intro: episodes[0]?.summary ?? '',
            heroSlugs: [],
            order: null
          }
        : null)

    if (!draft) {
      if (isDev) {
        console.warn(`story: missing tale metadata for "${taleKey}" — skipped`)
      }
      continue
    }

    const sortedEpisodes = episodes.toSorted(
      (a, b) => (a.order ?? 999) - (b.order ?? 999) || a.title.localeCompare(b.title)
    )

    tales.push({
      id: draft.slug,
      slug: draft.slug,
      title: draft.title,
      subtitle: draft.subtitle,
      cover: draft.cover,
      intro: draft.intro || sortedEpisodes[0]?.summary || '',
      heroSlugs: draft.heroSlugs,
      notionPageId: draft.notionPageId,
      episodes: sortedEpisodes.map(({ order: _o, taleIds: _t, taleKey: _k, ...ep }) => ep)
    })
  }

  const orderFor = (tale: Tale) => {
    const bySlug = [...taleDrafts.values()].find((d) => d.slug === tale.slug)
    return bySlug?.order ?? 999
  }

  return tales.toSorted(
    (a, b) => orderFor(a) - orderFor(b) || a.title.localeCompare(b.title)
  )
}

function serializeEpisode(episode: Episode): Episode {
  return {
    id: episode.id,
    title: episode.title,
    icon: episode.icon,
    ...(episode.summary ? { summary: episode.summary } : {}),
    ...(episode.content?.length ? { content: episode.content } : {}),
    ...(episode.notionPageId ? { notionPageId: episode.notionPageId } : {}),
    ...(episode.href ? { href: episode.href } : {}),
    ...(episode.heroes?.length ? { heroes: episode.heroes } : {})
  }
}

/** Next.js getStaticProps cannot serialize `undefined` optional fields. */
function serializeTale(tale: Tale): Tale {
  return {
    id: tale.id,
    slug: tale.slug,
    title: tale.title,
    intro: tale.intro,
    heroSlugs: tale.heroSlugs,
    episodes: tale.episodes.map(serializeEpisode),
    ...(tale.subtitle ? { subtitle: tale.subtitle } : {}),
    ...(tale.cover ? { cover: tale.cover } : {}),
    ...(tale.notionPageId ? { notionPageId: tale.notionPageId } : {})
  }
}

export async function loadTales(): Promise<Tale[]> {
  try {
    const recordMap = await fetchStoriesRecordMap()
    if (!recordMap) {
      return []
    }
    const tales = getTalesFromRecordMap(recordMap)
    if (!tales.length && isDev) {
      console.warn(
        'story: no tales were parsed from Notion. Check that episode rows link to a tale, Public is enabled, and the databases are published to the web.'
      )
    }
    return tales.map(serializeTale)
  } catch (err) {
    console.error('story: failed to load tales from Notion', err)
    return []
  }
}
