import { ContentSkeleton } from './ContentSkeleton'
import { SiteHeader } from './SiteHeader'

export function Loading() {
  return (
    <div className='zn-page'>
      <SiteHeader />
      <main className='zn-container zn-section zn-page-skeleton'>
        <div className='zn-skeleton zn-skeleton-cover' aria-hidden='true' />
        <ContentSkeleton />
      </main>
    </div>
  )
}
