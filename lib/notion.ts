import {
  type ExtendedRecordMap,
  type SearchParams,
  type SearchResults
} from 'notion-types'
import { mergeRecordMaps } from 'notion-utils'
import pMap from 'p-map'
import pMemoize from 'p-memoize'

import {
  isPreviewImageSupportEnabled,
  navigationLinks,
  navigationStyle
} from './config'
import { getTweetsMap } from './get-tweets'
import { notion } from './notion-api'
import {
  hydrateNotionCollectionQueries,
  normalizeNotionApiRecordMap
} from './notion-record-map'
import { withNotionRetry } from './notion-retry'
import { getPreviewImageMap } from './preview-images'

/** Per-collection merge so two pages sharing a database do not clobber view queries. */
function deepMergeCollectionQuery(
  a: ExtendedRecordMap['collection_query'],
  b: ExtendedRecordMap['collection_query']
): ExtendedRecordMap['collection_query'] {
  const out: Record<string, Record<string, unknown>> = a
    ? { ...(a as Record<string, Record<string, unknown>>) }
    : {}
  if (!b) {
    return out as ExtendedRecordMap['collection_query']
  }
  for (const [collectionId, views] of Object.entries(
    b as Record<string, Record<string, unknown>>
  )) {
    const prev = out[collectionId]
    out[collectionId] = prev ? { ...prev, ...views } : { ...views }
  }
  return out as ExtendedRecordMap['collection_query']
}

const getNavigationLinkPages = pMemoize(
  async (): Promise<ExtendedRecordMap[]> => {
    const navigationLinkPageIds = (navigationLinks || [])
      .map((link) => link?.pageId)
      .filter(Boolean)

    if (navigationStyle !== 'default' && navigationLinkPageIds.length) {
      return pMap(
        navigationLinkPageIds,
        async (navigationLinkPageId) =>
          withNotionRetry(() =>
            notion.getPage(navigationLinkPageId, {
              chunkLimit: 1,
              fetchMissingBlocks: false,
              fetchCollections: false,
              signFileUrls: false,
              concurrency: 1
            })
          ),
        {
          concurrency: 2
        }
      )
    }

    return []
  }
)

const notionPageConcurrency = Number(process.env.NOTION_GETPAGE_CONCURRENCY ?? '2')

export async function getPage(pageId: string): Promise<ExtendedRecordMap> {
  let recordMap = await withNotionRetry(() =>
    notion.getPage(pageId, {
      concurrency: notionPageConcurrency
    })
  )
  normalizeNotionApiRecordMap(recordMap)
  await hydrateNotionCollectionQueries(notion, recordMap, pageId, {
    concurrency: notionPageConcurrency
  })

  if (navigationStyle !== 'default') {
    // ensure that any pages linked to in the custom navigation header have
    // their block info fully resolved in the page record map so we know
    // the page title, slug, etc.
    const navigationLinkRecordMaps = await getNavigationLinkPages()

    if (navigationLinkRecordMaps?.length) {
      recordMap = navigationLinkRecordMaps.reduce((map, navigationLinkRecordMap) => {
        const merged = mergeRecordMaps(map, navigationLinkRecordMap)
        return {
          ...merged,
          collection_query: deepMergeCollectionQuery(
            map.collection_query,
            navigationLinkRecordMap.collection_query
          )
        }
      }, recordMap)
      normalizeNotionApiRecordMap(recordMap)
      await hydrateNotionCollectionQueries(notion, recordMap, pageId, {
        concurrency: notionPageConcurrency
      })
    }
  }

  if (isPreviewImageSupportEnabled) {
    const previewImageMap = await getPreviewImageMap(recordMap)
    ;(recordMap as any).preview_images = previewImageMap
  }

  await getTweetsMap(recordMap)

  return recordMap
}

export async function search(params: SearchParams): Promise<SearchResults> {
  return notion.search(params)
}
