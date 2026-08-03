import type { MetadataRoute } from 'next'
import { getArticles } from '@/src/lib/content'
import { siteConfig } from '@/src/lib/site'

export const dynamic = 'force-static'

const siteReleaseDate = new Date('2026-08-03T00:00:00+03:30')
const paths = [
  '',
  '/campaign',
  '/blog',
  '/pricing',
  '/about',
  '/privacy',
  '/terms',
  '/safety',
  '/support',
] as const

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articlesEn, articlesFa] = await Promise.all([
    getArticles('en'),
    getArticles('fa'),
  ])

  const staticPages: MetadataRoute.Sitemap = paths.flatMap((path) => {
    const enUrl = `${siteConfig.url}${path}`
    const faUrl = `${siteConfig.url}/fa${path}`
    const priority = path === '' ? 1 : path === '/campaign' ? 0.9 : 0.7
    return [
      {
        url: enUrl,
        lastModified: siteReleaseDate,
        changeFrequency: path === '/blog' ? ('daily' as const) : ('monthly' as const),
        priority,
        alternates: { languages: { en: enUrl, fa: faUrl } },
      },
      {
        url: faUrl,
        lastModified: siteReleaseDate,
        changeFrequency: path === '/blog' ? ('daily' as const) : ('monthly' as const),
        priority,
        alternates: { languages: { en: enUrl, fa: faUrl } },
      },
    ]
  })

  const articleMapFa = new Map(articlesFa.map((article) => [article.slug, article]))
  const articlePages: MetadataRoute.Sitemap = articlesEn.flatMap((article) => {
    const faArticle = articleMapFa.get(article.slug)
    const enUrl = `${siteConfig.url}/blog/${article.slug}`
    const faUrl = `${siteConfig.url}/fa/blog/${faArticle?.slug ?? article.slug}`
    const lastModified = new Date(article.updatedAt)
    return [
      {
        url: enUrl,
        lastModified,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
        alternates: { languages: { en: enUrl, fa: faUrl } },
      },
      {
        url: faUrl,
        lastModified,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
        alternates: { languages: { en: enUrl, fa: faUrl } },
      },
    ]
  })

  const categoriesEn = new Map(
    articlesEn.map((article) => [article.category.slug, article.category]),
  )
  const categoryPages: MetadataRoute.Sitemap = Array.from(categoriesEn.values()).flatMap((category) => {
    const enUrl = `${siteConfig.url}/category/${category.slug}`
    const faUrl = `${siteConfig.url}/fa/category/${category.slug}`
    return [
      {
        url: enUrl,
        lastModified: siteReleaseDate,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
        alternates: { languages: { en: enUrl, fa: faUrl } },
      },
      {
        url: faUrl,
        lastModified: siteReleaseDate,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
        alternates: { languages: { en: enUrl, fa: faUrl } },
      },
    ]
  })

  return [...staticPages, ...categoryPages, ...articlePages]
}
