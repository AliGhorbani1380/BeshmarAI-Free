import {
  getLocalArticleEn,
  getLocalArticlesEn,
} from './local.en'
import {
  getLocalArticleFa,
  getLocalArticlesFa,
} from './local.fa'

export type ContentLocale =
  | 'en'
  | 'fa'

export async function getArticles(
  locale:
    ContentLocale = 'en',
) {
  return locale === 'fa'
    ? getLocalArticlesFa()
    : getLocalArticlesEn()
}

export async function getArticle(
  slug: string,
  locale:
    ContentLocale = 'en',
) {
  return locale === 'fa'
    ? getLocalArticleFa(slug)
    : getLocalArticleEn(slug)
}
