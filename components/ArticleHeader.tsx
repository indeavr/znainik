import Link from 'next/link'
import { type ExtendedRecordMap, type PageBlock } from 'notion-types'
import { getPageTableOfContents, uuidToId } from 'notion-utils'
import * as React from 'react'

import { estimateReadTimeMinutes } from '@/lib/estimate-read-time'
import { getArticleTags, tagToSlug } from '@/lib/get-articles'
import {
  formatBulgarianDate,
  getPageAuthorName,
  getPagePublishedTimestamp
} from '@/lib/get-page-meta'

/** Reader-facing metadata; editorial fields stay in Notion for ordering. */
export function ArticleHeader({
  block,
  recordMap
}: {
  block: PageBlock
  recordMap: ExtendedRecordMap
}) {
  const contents = React.useRef<HTMLDetailsElement>(null)
  const tags = getArticleTags(block, recordMap)
  const author = getPageAuthorName(block, recordMap)
  const published = getPagePublishedTimestamp(block, recordMap)
  const readMinutes = estimateReadTimeMinutes(block, recordMap)
  const toc = getPageTableOfContents(block, recordMap)

  return (
    <div className='zn-article-header'>
      {tags.length > 0 && (
        <nav className='zn-article-topics' aria-label='Теми на статията'>
          {tags.map((tag) => (
            <Link key={tag} href={`/tags/${tagToSlug(tag)}`}>
              {tag}
            </Link>
          ))}
        </nav>
      )}
      {(author || published || readMinutes > 0) && (
        <div className='zn-article-byline'>
          {author && <span className='zn-article-author'>{author}</span>}
          {published && (
            <time dateTime={new Date(published).toISOString()}>
              {formatBulgarianDate(published)}
            </time>
          )}
          {readMinutes > 0 && <span>{readMinutes} мин четене</span>}
        </div>
      )}
      {toc.length >= 3 && (
        <details ref={contents} className='zn-article-contents'>
          <summary>Съдържание</summary>
          <nav aria-label='Раздели в статията'>
            {toc.map((item) => (
              <a
                key={item.id}
                href={`#${uuidToId(item.id)}`}
                style={{
                  paddingInlineStart: `${12 + item.indentLevel * 14}px`
                }}
                onClick={() => {
                  if (contents.current) contents.current.open = false
                }}
              >
                {item.text}
              </a>
            ))}
          </nav>
        </details>
      )}
    </div>
  )
}
