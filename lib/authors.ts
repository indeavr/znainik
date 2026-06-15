import * as config from './config'

export interface Author {
  name: string
  /** Path under /public or absolute URL. Optional — falls back to initials. */
  avatar?: string
  role?: string
  bio?: string
  twitter?: string
  url?: string
}

/**
 * Author registry. Add an entry per author name exactly as it appears in the
 * Notion "Author" property. Drop avatars into /public/authors/ (square, ~256px).
 *
 * Authors without an entry still render with their name + initials avatar.
 */
const AUTHORS: Record<string, Author> = {
  [config.author.toLowerCase()]: {
    name: config.author,
    // Add an avatar by dropping a file in /public/authors/ and setting e.g.
    // avatar: '/authors/default.png'. Until then we render initials.
    role: 'Автор',
    bio: config.description,
    twitter: config.twitter,
    url: `https://${config.domain}`
  }
  // Example of an additional author:
  // 'мария иванова': {
  //   name: 'Мария Иванова',
  //   avatar: '/authors/maria.png',
  //   role: 'Редактор',
  //   bio: 'Пише за древна мъдрост и съвременен живот.'
  // }
}

export function getAuthor(name: string | undefined): Author {
  const trimmed = (name || config.author).trim()
  return (
    AUTHORS[trimmed.toLowerCase()] ?? {
      name: trimmed
    }
  )
}

export function authorInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
