import { type Block } from 'notion-types'
import { defaultMapImageUrl } from 'notion-utils'

import { defaultPageCover, defaultPageIcon } from './config'

export const mapImageUrl = (url: string | undefined, block: Block) => {
  if (url === defaultPageCover || url === defaultPageIcon) {
    return url
  }

  const mapped = defaultMapImageUrl(url, block)
  // Notion's legacy image host rejects server-side requests (403).
  return mapped?.replace(
    /^https:\/\/(?:www\.)?notion\.so\//,
    'https://app.notion.com/'
  )
}
