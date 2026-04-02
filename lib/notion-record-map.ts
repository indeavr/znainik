import type { NotionAPI } from 'notion-client'
import type { ExtendedRecordMap } from 'notion-types'
import { getBlockCollectionId, getPageContentBlockIds, parsePageId } from 'notion-utils'
import pMap from 'p-map'

/**
 * Notion sometimes returns each record as `{ value: { value: actualRecord, role? } }`.
 * notion-utils 7.10+ adds `getBlockValue` and fixes traversal (issue #682); we still
 * flatten once so code that reads `recordMap.block[id].value` directly keeps working.
 */
export function normalizeNotionApiRecordMap(recordMap: ExtendedRecordMap): void {
  const tables = [
    recordMap.block,
    recordMap.collection,
    recordMap.collection_view,
    recordMap.notion_user
  ] as const

  for (const table of tables) {
    if (!table) continue
    for (const id of Object.keys(table)) {
      const entry = table[id] as { value?: unknown } | undefined
      if (!entry?.value || typeof entry.value !== 'object' || entry.value === null) {
        continue
      }
      const outer = entry.value as Record<string, unknown>
      if ('type' in outer || 'schema' in outer) {
        continue
      }
      const inner = outer.value
      if (
        inner &&
        typeof inner === 'object' &&
        ('type' in (inner as object) ||
          'schema' in (inner as object) ||
          'properties' in (inner as object))
      ) {
        entry.value = inner as typeof entry.value
      }
    }
  }
}

/**
 * Fills missing `collection_query` entries (older notion-client before 7.10, or edge
 * cases). On notion-utils ≥7.10 this is usually a no-op because getPage already
 * populated queries.
 */
export async function hydrateNotionCollectionQueries(
  client: NotionAPI,
  recordMap: ExtendedRecordMap,
  pageId: string,
  options?: { collectionReducerLimit?: number; concurrency?: number }
): Promise<void> {
  const collectionReducerLimit = options?.collectionReducerLimit ?? 999
  const concurrency = options?.concurrency ?? 3

  recordMap.collection_query = recordMap.collection_query ?? {}
  const rootId = parsePageId(pageId) ?? pageId
  const contentBlockIds = getPageContentBlockIds(recordMap, rootId)

  const allCollectionInstances = contentBlockIds.flatMap((blockId) => {
    const block = recordMap.block[blockId]?.value
    const collectionId =
      block &&
      (block.type === 'collection_view' || block.type === 'collection_view_page') &&
      getBlockCollectionId(block, recordMap)
    if (collectionId) {
      const spaceId = block?.space_id
      return (
        block.view_ids?.map((collectionViewId) => ({
          collectionId,
          collectionViewId,
          spaceId
        })) ?? []
      )
    }
    return []
  })

  await pMap(
    allCollectionInstances,
    async ({ collectionId, collectionViewId, spaceId }) => {
      const existing =
        recordMap.collection_query[collectionId]?.[collectionViewId]
      if (existing != null) {
        return
      }
      const collectionView =
        recordMap.collection_view[collectionViewId]?.value
      try {
        const collectionData = await client.getCollectionData(
          collectionId,
          collectionViewId,
          collectionView,
          {
            limit: collectionReducerLimit,
            spaceId,
            ofetchOptions: { timeout: 60_000 }
          }
        )
        recordMap.block = {
          ...recordMap.block,
          ...collectionData.recordMap.block
        }
        recordMap.collection = {
          ...recordMap.collection,
          ...collectionData.recordMap.collection
        }
        recordMap.collection_view = {
          ...recordMap.collection_view,
          ...collectionData.recordMap.collection_view
        }
        recordMap.notion_user = {
          ...recordMap.notion_user,
          ...collectionData.recordMap.notion_user
        }
        const reducerResults = collectionData.result?.reducerResults
        if (reducerResults !== undefined) {
          const cq = recordMap.collection_query as Record<
            string,
            Record<string, typeof reducerResults>
          >
          cq[collectionId] = {
            ...cq[collectionId],
            [collectionViewId]: reducerResults
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        console.warn(
          'Notion collectionQuery (hydrate) error',
          {
            pageId,
            collectionId,
            collectionViewId
          },
          message
        )
      }
    },
    { concurrency }
  )

  normalizeNotionApiRecordMap(recordMap)
}
