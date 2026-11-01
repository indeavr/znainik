export const TAG_ICONS: Record<string, string> = {
  даоизъм: '/tags/dao.png',
  себепознание: '/tags/path.png',
  'технологии и съзнание': '/tags/ai.png',
  'любов и отношения': '/tags/love.png',
  суфизъм: '/tags/sufism.png',
  'внимание и медитация': '/tags/spirit.png',
  'приказки и символи': '/tags/history.png',
  'българска култура': '/tags/ancient.png'
}

/** Keep bookmarked topic URLs usable after the October 2026 Notion cleanup. */
const LEGACY_TOPICS: Record<string, string> = {
  дао: 'Даоизъм',
  път: 'Себепознание',
  дух: 'Себепознание',
  'нещата от живота': 'Себепознание',
  '12сфери': 'Себепознание',
  ai: 'Технологии и съзнание',
  love: 'Любов и отношения',
  sufism: 'Суфизъм',
  'древни знания': 'Даоизъм',
  история: 'Приказки и символи',
  'творчество/креативност': 'Творчество',
  фокус: 'Внимание и медитация',
  финанси: 'Пари и обмен',
  деца: 'Учене и образование',
  образование: 'Учене и образование',
  общност: 'Общности и сътрудничество',
  азайра: 'Общности и сътрудничество',
  българия: 'Българска култура'
}

export function getLegacyTopic(slug: string): string | undefined {
  try {
    const key = decodeURIComponent(slug)
      .normalize('NFKC')
      .trim()
      .toLocaleLowerCase('bg')
      .replaceAll(/[-\s]+/g, ' ')
    return Object.hasOwn(LEGACY_TOPICS, key) ? LEGACY_TOPICS[key] : undefined
  } catch {
    return undefined
  }
}

export function getTagIcon(tag: string): string {
  const normalized = (getLegacyTopic(tag) ?? tag).trim().toLocaleLowerCase('bg')
  return TAG_ICONS[normalized] || '/tags/default.png'
}
