/**
 * Story-game content model ("Приказки").
 *
 * Tales and episodes are loaded from Notion — see `lib/get-stories-from-notion.ts`
 * and `storiesNotionPageId` in site.config.ts. Heroes stay in this file for now
 * (stable portraits in /public/story/heroes).
 *
 * Notion setup (one-time):
 * 1. Create a hub page in Notion (e.g. "Приказки — сайт").
 * 2. Embed linked views of your Episodes (+ optional Tales) databases.
 * 3. Share the hub page to the web (same as the main site).
 * 4. Paste the hub page id into `storiesNotionPageId` in site.config.ts.
 *
 * Each episode row in Notion is a page — its body is rendered inline on the site.
 * Link episodes to a tale via a Relation property (or a text "Приказка" field).
 */

export interface Hero {
  id: string
  name: string
  /** Short epithet / role, e.g. "Пазителка на светлината". */
  title?: string
  /** Path under /public, e.g. "/story/heroes/azaira.png". */
  image: string
  /** One-line teaser shown on the portrait. */
  summary: string
  /** Full description paragraphs shown when the hero is opened. */
  description: string[]
  traits?: string[]
}

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
  /** Hero ids that appear in this episode (optional spotlight). */
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
  /** Hero ids that make up this tale's codex. */
  heroIds: string[]
}

// ---------------------------------------------------------------------------
// Heroes (global codex; tales reference these by id)
// ---------------------------------------------------------------------------

const heroes: Hero[] = [
  {
    id: 'azaira',
    name: 'Азайра',
    title: 'Пазителка на светлината',
    image: '/story/heroes/azaira.png',
    summary: 'Носи древното знание и води героите по пътя.',
    description: [
      'Азайра е пазителка на изгубеното знание — тази, която помни началото на всички приказки. Тя се появява в мигове на избор и осветява пътя, без да го извървява вместо теб.',
      'Силата ѝ не е в меча, а в думата и в светлината, която събужда смелост у онези, които са я забравили.'
    ],
    traits: ['Мъдрост', 'Светлина', 'Водачество']
  },
  {
    id: 'vela',
    name: 'Вела',
    title: 'Безстрашната',
    image: '/story/heroes/vela.png',
    summary: 'Млада героиня, тръгнала да върне златната ябълка.',
    description: [
      'Вела расте в малко село в полите на планината. Когато златната ябълка изчезва и земята започва да линее, тя е единствената, която тръгва да я върне.',
      'Решителна и любопитна, Вела се учи, че истинската смелост е да продължиш дори когато се страхуваш.'
    ],
    traits: ['Смелост', 'Вярност', 'Находчивост']
  },
  {
    id: 'zmey',
    name: 'Змей',
    title: 'Пазителят на планината',
    image: '/story/heroes/zmey.png',
    summary: 'Древен страж — не враг, а изпитание.',
    description: [
      'Змеят пази върха, където расте дървото на златната ябълка. Векове наред хората го мислят за чудовище, но той е по-скоро изпитание, отколкото враг.',
      'Който дойде с алчност, го среща гневът му. Който дойде с чисто сърце, открива съюзник.'
    ],
    traits: ['Сила', 'Древност', 'Справедливост']
  }
]

// ---------------------------------------------------------------------------
// Accessors
// ---------------------------------------------------------------------------

export function getHero(id: string): Hero | undefined {
  return heroes.find((h) => h.id === id)
}

export function getTaleHeroes(tale: Tale): Hero[] {
  return tale.heroIds
    .map((id) => getHero(id))
    .filter((h): h is Hero => h !== undefined)
}

/** All Notion page ids referenced by a tale's episodes (for build-time fetch). */
export function getTaleNotionPageIds(tale: Tale): string[] {
  return tale.episodes
    .map((e) => e.notionPageId)
    .filter((id): id is string => id !== undefined)
}
