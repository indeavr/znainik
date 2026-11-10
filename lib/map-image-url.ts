import { type Block } from 'notion-types'
import { defaultMapImageUrl } from 'notion-utils'

import { defaultPageCover, defaultPageIcon } from './config'

/**
 * Notion now hands out files as short-lived signed links
 * (file.notion.com/f/f/{space}/{file}/{name}?…&expirationTimestamp=…&signature=…).
 * Cached pages keep them past their expiry and the images break (HTTP 419). The same file has a
 * permanent address, attachment:{file}:{name}, which Notion's image host resolves on every request.
 */
const SIGNED_FILE =
  /^https:\/\/file\.notion\.com\/f\/f\/[^/]+\/([0-9a-f-]{36})\/([^?#]+)/i

export function permanentFileUrl(url: string): string {
  const match = SIGNED_FILE.exec(url)
  return match ? `attachment:${match[1]}:${match[2]}` : url
}

export const mapImageUrl = (url: string | undefined, block: Block) => {
  if (url === defaultPageCover || url === defaultPageIcon) {
    return url
  }

  const mapped = defaultMapImageUrl(url && permanentFileUrl(url), block)
  // Notion's legacy image host rejects server-side requests (403).
  return mapped?.replace(
    /^https:\/\/(?:www\.)?notion\.so\//,
    'https://app.notion.com/'
  )
}
