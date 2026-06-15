import { type Block, type ExtendedRecordMap } from 'notion-types'

import { getPageTweet } from '@/lib/get-page-tweet'

import { ArticleEngagement } from './ArticleEngagement'
import { PageActions } from './PageActions'
import { PageSocial } from './PageSocial'

export function PageAside({
  block,
  recordMap,
  isBlogPost
}: {
  block: Block
  recordMap: ExtendedRecordMap
  isBlogPost: boolean
}) {
  if (!block) {
    return null
  }

  // Blog posts get a sticky engagement rail (likes + views), plus the original
  // tweet actions when the page is linked to a tweet.
  if (isBlogPost) {
    const tweet = getPageTweet(block, recordMap)

    return (
      <div className='zn-aside-stack'>
        <ArticleEngagement pageId={block.id} />
        {tweet && <PageActions tweet={tweet} />}
      </div>
    )
  }

  return <PageSocial />
}
