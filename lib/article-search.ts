import type { Article } from './get-articles'

function normalize(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('bg-BG')
    .replaceAll(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

function matchesWord(words: string[], term: string): boolean {
  return words.some(
    (word) => word === term || (term.length >= 3 && word.startsWith(term))
  )
}

/** All words must match; scattered letters in unrelated prose are not a match. */
export function searchArticles(articles: Article[], query: string): Article[] {
  const phrase = normalize(query)
  if (!phrase) return articles
  const terms = [...new Set(phrase.split(' '))]

  return articles
    .map((article) => {
      const title = normalize(article.title)
      const topics = article.tags.map(normalize)
      const titleWords = title.split(' ')
      const topicWords = topics.flatMap((topic) => topic.split(' '))
      const descriptionWords = normalize(article.description).split(' ')
      const scores = terms.map((term) =>
        matchesWord(titleWords, term)
          ? 30
          : matchesWord(topicWords, term)
            ? 20
            : matchesWord(descriptionWords, term)
              ? 5
              : 0
      )
      const score = scores.every((value) => value > 0)
        ? scores.reduce<number>((total, value) => total + value, 0) +
          (title === phrase
            ? 200
            : ` ${title} `.includes(` ${phrase} `)
              ? 80
              : 0) +
          (topics.includes(phrase) ? 40 : 0)
        : 0
      return { article, score }
    })
    .filter(({ score }) => score > 0)
    .toSorted((a, b) => b.score - a.score)
    .map(({ article }) => article)
}
