import { type ExtendedRecordMap } from 'notion-types'
import {
  getCanonicalPageId as getCanonicalPageIdImpl,
  parsePageId
} from 'notion-utils'

import { inversePageUrlOverrides } from './config'

export function getCanonicalPageId(
  pageId: string,
  recordMap: ExtendedRecordMap,
  { uuid = true }: { uuid?: boolean } = {}
): string | undefined {
  if (pageId == null || pageId === '' || !recordMap) {
    return undefined
  }
  const cleanPageId = parsePageId(String(pageId), { uuid: false })
  if (!cleanPageId) {
    return undefined
  }

  const override = inversePageUrlOverrides[cleanPageId]
  if (override) {
    return override
  }
  return (
    getCanonicalPageIdImpl(String(pageId), recordMap, {
      uuid
    }) ?? undefined
  )
}
