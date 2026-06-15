import type * as types from 'notion-types'
import { Header } from 'react-notion-x'

import { SiteHeader } from '@/components/SiteHeader'
import { navigationStyle } from '@/lib/config'

/**
 * Header for Notion-rendered pages (articles, etc.).
 * Uses the same SiteHeader as the marketing pages for a consistent nav + mobile menu.
 */
export function NotionPageHeader({
  block
}: {
  block: types.CollectionViewPageBlock | types.PageBlock
}) {
  if (navigationStyle === 'default') {
    return <Header block={block} />
  }

  return <SiteHeader />
}
