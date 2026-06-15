import { FaTwitter } from '@react-icons/all-files/fa/FaTwitter'
import * as React from 'react'

import { type Author, authorInitials } from '@/lib/authors'

/** Avatar that shows the author's image or falls back to initials. */
export function AuthorAvatar({
  author,
  size = 44
}: {
  author: Author
  size?: number
}) {
  const [errored, setErrored] = React.useState(false)
  const showImg = author.avatar && !errored

  return (
    <span
      className='zn-avatar'
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden='true'
    >
      {showImg ? (
        <img
          src={author.avatar}
          alt={author.name}
          onError={() => setErrored(true)}
        />
      ) : (
        authorInitials(author.name)
      )}
    </span>
  )
}

/** A Medium-style "Written by" card shown at the end of an article. */
export function AuthorCard({ author }: { author: Author }) {
  return (
    <div className='zn-article-extras zn-author-card'>
      <AuthorAvatar author={author} size={64} />
      <div className='zn-author-card-body'>
        <div className='zn-author-card-label'>Написано от</div>
        <div className='zn-author-card-name'>{author.name}</div>
        {author.bio && <p className='zn-author-card-bio'>{author.bio}</p>}
        {author.twitter && (
          <a
            className='zn-author-card-link'
            href={`https://twitter.com/${author.twitter}`}
            target='_blank'
            rel='noopener noreferrer'
          >
            <FaTwitter /> @{author.twitter}
          </a>
        )}
      </div>
    </div>
  )
}
