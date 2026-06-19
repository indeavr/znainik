import { IoTrashOutline } from '@react-icons/all-files/io5/IoTrashOutline'
import * as React from 'react'

import { type Comment } from '@/lib/comments'

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat('bg-BG', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(iso))
  } catch {
    return ''
  }
}

function CommentAvatar({
  name,
  image
}: {
  name: string
  image: string | null
}) {
  const [errored, setErrored] = React.useState(false)
  const showImg = image && !errored

  return (
    <span className='zn-comment-avatar' aria-hidden='true'>
      {showImg ? (
        <img src={image} alt='' onError={() => setErrored(true)} />
      ) : (
        initials(name)
      )}
    </span>
  )
}

export function CommentList({
  comments,
  currentUserId,
  onDelete
}: {
  comments: Comment[]
  currentUserId?: string
  onDelete: (id: string) => void
}) {
  if (!comments.length) {
    return (
      <p className='zn-comments-empty'>
        Все още няма коментари. Бъдете първият глас в общността.
      </p>
    )
  }

  return (
    <ul className='zn-comment-list'>
      {comments.map((comment) => {
        const own = currentUserId === comment.userId
        return (
          <li key={comment.id} className='zn-comment'>
            <CommentAvatar name={comment.userName} image={comment.userImage} />
            <div className='zn-comment-body'>
              <div className='zn-comment-meta'>
                <span className='zn-comment-author'>{comment.userName}</span>
                <span className='zn-card-dot' />
                <time dateTime={comment.createdAt}>{formatWhen(comment.createdAt)}</time>
                {own && (
                  <button
                    type='button'
                    className='zn-comment-delete'
                    onClick={() => onDelete(comment.id)}
                    aria-label='Изтрий коментара'
                    title='Изтрий'
                  >
                    <IoTrashOutline />
                  </button>
                )}
              </div>
              <p className='zn-comment-text'>{comment.body}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
