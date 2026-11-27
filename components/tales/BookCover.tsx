import cs from 'classnames'

import type { TaleCover } from '@/lib/tale-showcase'

/**
 * A cover shown as a book: the art, a shaded spine and the page edges.
 * `sizes` should match the width the cover gets in the layout.
 */
export function BookCover({
  cover,
  sizes,
  priority = false,
  className
}: {
  cover: TaleCover
  sizes: string
  priority?: boolean
  className?: string
}) {
  return (
    <span
      className={cs('tl-book', className)}
      style={{ aspectRatio: `${cover.width} / ${cover.height}` }}
    >
      <img
        className='tl-book-art'
        src={cover.small}
        srcSet={`${cover.small} 480w, ${cover.large} 960w`}
        sizes={sizes}
        width={cover.width}
        height={cover.height}
        alt={cover.alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding='async'
        fetchPriority={priority ? 'high' : undefined}
      />
      <span className='tl-book-spine' aria-hidden='true' />
      <span className='tl-book-pages' aria-hidden='true' />
    </span>
  )
}
