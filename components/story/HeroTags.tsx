import * as React from 'react'

/** Hero slugs from Notion (no separate character database). */
export function HeroTags({
  slugs,
  label = 'Герои'
}: {
  slugs: string[]
  label?: string
}) {
  if (!slugs.length) return null

  return (
    <div className='zn-hero-tags'>
      <span className='zn-hero-tags-label'>{label}</span>
      <ul className='zn-hero-tags-list'>
        {slugs.map((slug) => (
          <li key={slug} className='zn-hero-tag'>
            {slug}
          </li>
        ))}
      </ul>
    </div>
  )
}
