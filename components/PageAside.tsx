import { type Block, type ExtendedRecordMap } from 'notion-types'

import { PageSocial } from './PageSocial'

/**
 * The aside beside a page. Articles keep only their contents list: the old Twitter like and
 * retweet buttons pointed people away from Знайник.
 */
export function PageAside({
  block,
  isBlogPost
}: {
  block: Block
  recordMap: ExtendedRecordMap
  isBlogPost: boolean
}) {
  if (!block || isBlogPost) {
    return null
  }

  return <PageSocial />
}
