import { getAllPagesInSpace, getPageProperty } from 'notion-utils'
import pMemoize from 'p-memoize'

import type * as types from './types'
import * as config from './config'
import { includeNotionIdInUrls } from './config'
import { getCanonicalPageId } from './get-canonical-page-id'
import { getNotionBlockValue } from './get-notion-block-value'
import { notion } from './notion-api'
import { normalizeNotionApiRecordMap } from './notion-record-map'
import { withNotionRetry } from './notion-retry'
import { safeUuidToId } from './safe-notion-id'

const uuid = !!includeNotionIdInUrls

/** Parallel page fetches while crawling the workspace (lower = fewer 429s from Notion). */
const sitemapQueueConcurrency = Number(
  process.env.NOTION_SITEMAP_QUEUE_CONCURRENCY ?? '2'
)

/** Parallel sub-requests inside each notion.getPage (e.g. collection queries). */
const sitemapGetPageConcurrency = Number(
  process.env.NOTION_SITEMAP_GETPAGE_CONCURRENCY ?? '1'
)

export async function getSiteMap(): Promise<types.SiteMap> {
  const partialSiteMap = await getAllPages(
    config.rootNotionPageId,
    config.rootNotionSpaceId ?? undefined
  )

  return {
    site: config.site,
    ...partialSiteMap
  } as types.SiteMap
}

const getAllPages = pMemoize(getAllPagesImpl, {
  cacheKey: (...args) => JSON.stringify(args)
})

const getPage = async (pageId: string, opts?: Record<string, unknown>) => {
  console.log('\nnotion getPage', safeUuidToId(pageId))
  return withNotionRetry(async () => {
    const recordMap = await notion.getPage(pageId, {
      ...opts,
      ofetchOptions: {
        timeout: 60_000,
        ...(opts?.ofetchOptions as object | undefined)
      },
      concurrency: sitemapGetPageConcurrency
    })
    normalizeNotionApiRecordMap(recordMap)
    return recordMap
  })
}

async function getAllPagesImpl(
  rootNotionPageId: string,
  rootNotionSpaceId?: string,
  {
    maxDepth = 1
  }: {
    maxDepth?: number
  } = {}
): Promise<Partial<types.SiteMap>> {
  const pageMap = await getAllPagesInSpace(
    rootNotionPageId,
    rootNotionSpaceId,
    getPage,
    {
      maxDepth,
      concurrency: sitemapQueueConcurrency
    }
  )

  const canonicalPageMap = Object.keys(pageMap).reduce(
    (map: Record<string, string>, pageId: string) => {
      const recordMap = pageMap[pageId]
      if (!recordMap) {
        throw new Error(`Error loading page "${pageId}"`)
      }

      const block = getNotionBlockValue(recordMap.block[pageId])
      if (
        !(getPageProperty<boolean | null>('Public', block!, recordMap) ?? true)
      ) {
        return map
      }

      const canonicalPageId = getCanonicalPageId(pageId, recordMap, {
        uuid
      })!

      if (map[canonicalPageId]) {
        // you can have multiple pages in different collections that have the same id
        // TODO: we may want to error if neither entry is a collection page
        console.warn('error duplicate canonical page id', {
          canonicalPageId,
          pageId,
          existingPageId: map[canonicalPageId]
        })

        return map
      } else {
        return {
          ...map,
          [canonicalPageId]: pageId
        }
      }
    },
    {}
  )

  return {
    pageMap,
    canonicalPageMap
  }
}
