import type * as types from './types'

export interface SiteConfig {
  rootNotionPageId: string
  rootNotionSpaceId?: string | null

  name: string
  domain: string
  author: string
  description?: string
  language?: string

  twitter?: string
  github?: string
  linkedin?: string
  newsletter?: string
  youtube?: string
  zhihu?: string
  mastodon?: string

  defaultPageIcon?: string | null
  defaultPageCover?: string | null
  defaultPageCoverPosition?: number | null

  isPreviewImageSupportEnabled?: boolean
  isTweetEmbedSupportEnabled?: boolean
  isRedisEnabled?: boolean
  isSearchEnabled?: boolean

  includeNotionIdInUrls?: boolean
  pageUrlOverrides?: types.PageUrlOverridesMap | null
  pageUrlAdditions?: types.PageUrlOverridesMap | null

  navigationStyle?: types.NavigationStyle
  navigationLinks?: Array<NavigationLink>

  /**
   * Notion page that embeds linked views of the Приказки / Епизоди databases.
   * Share the page to the web, then paste its id here (or NOTION_STORIES_PAGE_ID).
   */
  storiesNotionPageId?: string | null
  /** Episodes database id (optional; auto-detected from the hub when omitted). */
  storiesEpisodesCollectionId?: string | null
  /** Tales metadata database id (optional). */
  storiesTalesCollectionId?: string | null
}

export interface NavigationLink {
  title: string
  pageId?: string
  url?: string
}

export const siteConfig = (config: SiteConfig): SiteConfig => {
  return config
}
