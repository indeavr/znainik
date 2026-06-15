import Link from 'next/link'
import * as React from 'react'

import { tagToSlug } from '@/lib/get-articles'
import { getTagIcon } from '@/lib/tags'

export interface TagChip {
  tag: string
  count?: number
}

/** Renders tags as links to their tag pages (used on home + tag index). */
export function TagChips({
  tags,
  activeTag
}: {
  tags: TagChip[]
  activeTag?: string
}) {
  if (!tags.length) return null

  return (
    <div className='zn-chips'>
      {tags.map(({ tag, count }) => (
        <Link
          key={tag}
          href={`/tags/${tagToSlug(tag)}`}
          className='zn-chip'
          data-active={activeTag ? activeTag === tag : undefined}
        >
          <span className='zn-chip-icon'>
            <img src={getTagIcon(tag)} alt={tag} loading='lazy' />
          </span>
          <span className='zn-chip-label'>{tag}</span>
          {typeof count === 'number' && (
            <span className='zn-chip-count'>{count}</span>
          )}
        </Link>
      ))}
    </div>
  )
}
