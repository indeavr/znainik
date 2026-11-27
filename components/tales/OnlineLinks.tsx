import Link from 'next/link'

/** A Notion series („Епизоди“) that belongs to one of the four tales. */
export interface OnlineSeries {
  slug: string
  title: string
  episodes: number
}

/** Buttons to the readable episode pages of a tale, when it has any. */
export function OnlineLinks({
  series,
  label
}: {
  series: OnlineSeries[]
  label: (series: OnlineSeries) => string
}) {
  return (
    <>
      {series.map((item) => (
        <Link
          key={item.slug}
          className='tl-btn tl-btn-ghost'
          href={`/prikazki/${encodeURIComponent(item.slug)}`}
        >
          {label(item)} <span aria-hidden='true'>→</span>
        </Link>
      ))}
    </>
  )
}
