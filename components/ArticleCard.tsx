import Image from 'next/image'
import Link from 'next/link'
import * as React from 'react'

import type { Article } from '@/lib/get-articles'

function formatDate(date: number | null): string | null {
  if (!date) return null
  try {
    return new Intl.DateTimeFormat('bg-BG', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(date))
  } catch {
    return null
  }
}

export function ArticleCard({ article }: { article: Article }) {
  const date = formatDate(article.date)
  const [failedCover, setFailedCover] = React.useState<string | null>(null)

  return (
    <Link href={`/${article.slug}`} className='zn-card' prefetch={false}>
      <div className='zn-card-cover'>
        {article.cover && failedCover !== article.cover ? (
          <Image
            src={article.cover}
            alt={article.title}
            fill
            onError={() => setFailedCover(article.cover)}
            unoptimized={/\.gif(?:[?#]|$)/i.test(article.cover)}
            sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px'
          />
        ) : (
          <div className='zn-card-cover-fallback' aria-hidden='true'>
            {article.emoji || '✦'}
          </div>
        )}
      </div>

      <div className='zn-card-body'>
        <h3 className='zn-card-title'>{article.title}</h3>
        {article.description && (
          <p className='zn-card-desc'>{article.description}</p>
        )}

        <div className='zn-card-meta'>
          {article.tags[0] && <span>{article.tags[0]}</span>}
          {article.tags[0] && date && <span className='zn-card-dot' />}
          {date && <span>{date}</span>}
        </div>
      </div>
    </Link>
  )
}
