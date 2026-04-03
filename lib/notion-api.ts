import type { ExtendedRecordMap } from 'notion-types'
import { NotionAPI } from 'notion-client'
import {
  getBlockCollectionId,
  getPageContentBlockIds,
  uuidToId
} from 'notion-utils'
import pMap from 'p-map'

import {
  getNotionBlockValue,
  getNotionCollectionViewValue
} from './get-notion-block-value'
import { normalizeNotionApiRecordMap } from './notion-record-map'

type GetPageOptions = NonNullable<Parameters<NotionAPI['getPage']>[1]>

/**
 * notion-client's getPage runs getPageContentBlockIds before any consumer can
 * normalize Notion's occasional double-wrapped `{ value: { value: block } }`
 * nodes. Traversal then misses `content` and never loads collection views.
 * We normalize as soon as the record map exists (and after each block merge).
 */
export class ZnainikNotionAPI extends NotionAPI {
  override async getPage(
    pageId: string,
    options?: GetPageOptions
  ): Promise<ExtendedRecordMap> {
    const {
      concurrency = 3,
      fetchMissingBlocks = true,
      fetchCollections = true,
      signFileUrls = true,
      chunkLimit = 100,
      chunkNumber = 0,
      throwOnCollectionErrors = false,
      collectionReducerLimit = 999,
      fetchRelationPages = false,
      ofetchOptions
    } = options ?? {}

    const page = await this.getPageRaw(pageId, {
      chunkLimit,
      chunkNumber,
      ofetchOptions
    })
    const recordMap = page?.recordMap as ExtendedRecordMap | undefined
    if (!recordMap?.block) {
      throw new Error(`Notion page not found "${uuidToId(pageId)}"`)
    }

    normalizeNotionApiRecordMap(recordMap)

    recordMap.collection = recordMap.collection ?? {}
    recordMap.collection_view = recordMap.collection_view ?? {}
    recordMap.notion_user = recordMap.notion_user ?? {}
    recordMap.collection_query = {}
    recordMap.signed_urls = {}

    if (fetchMissingBlocks) {
      while (true) {
        const pendingBlockIds = getPageContentBlockIds(recordMap).filter(
          (id) => !recordMap.block[id]
        )
        if (!pendingBlockIds.length) {
          break
        }
        const newBlocks = await this.getBlocks(pendingBlockIds, ofetchOptions).then(
          (res) => res.recordMap.block
        )
        recordMap.block = { ...recordMap.block, ...newBlocks }
        normalizeNotionApiRecordMap(recordMap)
      }
    }

    const contentBlockIds = getPageContentBlockIds(recordMap)
    if (fetchCollections) {
      const allCollectionInstances = contentBlockIds.flatMap((blockId) => {
        const block = getNotionBlockValue(recordMap.block[blockId])
        const collectionId =
          block &&
          (block.type === 'collection_view' ||
            block.type === 'collection_view_page') &&
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
        async (collectionInstance) => {
          const { collectionId, collectionViewId, spaceId } = collectionInstance
          const collectionView = getNotionCollectionViewValue(
            recordMap.collection_view[collectionViewId]
          )
          try {
            const collectionData = await this.getCollectionData(
              collectionId,
              collectionViewId,
              collectionView,
              {
                limit: collectionReducerLimit,
                spaceId,
                ofetchOptions
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
            const cq = recordMap.collection_query as Record<
              string,
              Record<string, unknown>
            >
            cq[collectionId] = {
              ...cq[collectionId],
              [collectionViewId]: collectionData.result?.reducerResults
            }
            normalizeNotionApiRecordMap(recordMap)
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err)
            console.warn(
              'NotionAPI collectionQuery error',
              { pageId, collectionId, collectionViewId },
              message
            )
            if (throwOnCollectionErrors) {
              throw err
            }
            console.error(err)
          }
        },
        { concurrency }
      )
    }

    if (signFileUrls) {
      await this.addSignedUrls({ recordMap, contentBlockIds, ofetchOptions })
    }
    if (fetchRelationPages) {
      const newBlocks = await this.fetchRelationPages(recordMap, ofetchOptions)
      recordMap.block = { ...recordMap.block, ...newBlocks }
      normalizeNotionApiRecordMap(recordMap)
    }

    return recordMap
  }
}

export const notion = new ZnainikNotionAPI({
  apiBaseUrl: process.env.NOTION_API_BASE_URL
})
