import { type Article } from './get-articles'

export function selectRelatedArticles(
  articles: Article[],
  pageId: string
): Article[] {
  const sameId = (id: string) =>
    id.replaceAll('-', '') === pageId.replaceAll('-', '')
  const tags = new Set(
    articles.find((article) => sameId(article.pageId))?.tags ?? []
  )
  const scored = articles
    .filter((article) => !sameId(article.pageId))
    .map((article) => ({
      article,
      shared: article.tags.filter((tag) => tags.has(tag)).length
    }))
    .toSorted(
      (a, b) =>
        b.shared - a.shared || (b.article.date ?? 0) - (a.article.date ?? 0)
    )
  return (
    scored.some(({ shared }) => shared > 0)
      ? scored.filter(({ shared }) => shared > 0)
      : scored
  )
    .slice(0, 3)
    .map(({ article }) => article)
}
