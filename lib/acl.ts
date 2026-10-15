import { getPageProperty, parsePageId } from 'notion-utils'

import { getNotionBlockValue } from './get-notion-block-value'
import { type PageProps } from './types'

export async function pageAcl({
  site,
  recordMap,
  pageId
}: PageProps): Promise<PageProps | undefined> {
  if (!site) {
    return {
      error: {
        statusCode: 404,
        message: 'Unable to resolve notion site'
      }
    }
  }

  if (!recordMap) {
    return {
      error: {
        statusCode: 404,
        message: `Unable to resolve page for domain "${site.domain}". Notion page "${pageId}" not found.`
      }
    }
  }

  const rootKey = pageId ? (parsePageId(pageId) ?? pageId) : undefined

  if (!rootKey) {
    return {
      error: {
        statusCode: 404,
        message: `Unable to resolve page for domain "${site.domain}". Notion page "${pageId}" invalid data.`
      }
    }
  }

  const rootBlock = getNotionBlockValue(recordMap.block[rootKey])
  if (
    !rootBlock ||
    getPageProperty<boolean | null>('Public', rootBlock, recordMap) === false
  ) {
    return { error: { statusCode: 404, message: 'Page is not public' } }
  }
  const rootSpaceId = rootBlock.space_id

  if (
    rootSpaceId &&
    site.rootNotionSpaceId &&
    rootSpaceId !== site.rootNotionSpaceId
  ) {
    return {
      error: {
        statusCode: 404,
        message: `Notion page "${pageId}" doesn't belong to the Notion workspace owned by "${site.domain}".`
      }
    }
  }
}
