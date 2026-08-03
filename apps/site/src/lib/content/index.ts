import {
  getLocalArticle,
  getLocalArticles,
} from './local'

export async function getArticles() {
  return getLocalArticles()
}

export async function getArticle(
  slug: string,
) {
  return getLocalArticle(slug)
}
