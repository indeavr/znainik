export const TAG_ICONS: Record<string, string> = {
  'дао': '/tags/dao.png',
  'път': '/tags/path.png',
  'ai': '/tags/ai.png',
  'love': '/tags/love.png',
  'sufism': '/tags/sufism.png',
  'древни знания': '/tags/ancient.png',
  'дух': '/tags/spirit.png',
  'история': '/tags/history.png'
}

export function getTagIcon(tag: string): string {
  const normalized = tag.trim().toLowerCase()
  return TAG_ICONS[normalized] || '/tags/default.png'
}
