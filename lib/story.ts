/**
 * Story-game content model ("Приказки").
 *
 * Tales and episodes load from Notion — see `lib/get-stories-from-notion.ts`.
 * Heroes are slug strings in the Heroes text field (CSV), not a separate DB.
 */

export interface Episode {
  id: string
  title: string
  /** Emoji or short glyph shown in the timeline node. */
  icon: string
  /** Optional one-line teaser under the episode title. */
  summary?: string
  /** Story body paragraphs (inline). Optional when `notionPageId` is set. */
  content?: string[]
  /**
   * Render a Notion page's content inline as the episode body. When episodes
   * come from Notion, this is set automatically to the episode page id.
   */
  notionPageId?: string
  /** Optional "read more" link (internal /slug or external URL). */
  href?: string
  /** Hero slugs from the episode Heroes text field (CSV). */
  heroes?: string[]
}

export interface Tale {
  id: string
  slug: string
  title: string
  subtitle?: string
  cover?: string
  intro: string
  episodes: Episode[]
  /** Hero slugs from the tale Heroes text field (CSV). */
  heroSlugs: string[]
  /** Notion page id of the tale row (for canonical callout detection). */
  notionPageId?: string
}

/** All Notion page ids referenced by a tale (episodes + tale row). */
export function getTaleNotionPageIds(tale: Tale): string[] {
  const ids: string[] = []
  if (tale.notionPageId) ids.push(tale.notionPageId)
  for (const episode of tale.episodes) {
    if (episode.notionPageId) ids.push(episode.notionPageId)
  }
  return ids
}
