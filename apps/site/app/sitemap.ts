import type { MetadataRoute } from 'next'
import { getArticles } from '@/src/lib/content'
import { siteConfig } from '@/src/lib/site'

export const dynamic = 'force-static'

const siteReleaseDate = new Date('2026-07-31T01:06:00+03:30')

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getArticles()

  const staticPageConfig = [
    { path: '', frequency: 'weekly' as const, priority: 1 },
    { path: '/campaign', frequency: 'weekly' as const, priority: 0.95 },
    { path: '/blog', frequency: 'daily' as const, priority: 0.9 },
    { path: '/pricing', frequency: 'monthly' as const, priority: 0.8 },
    { path: '/about', frequency: 'monthly' as const, priority: 0.7 },
    { path: '/privacy', frequency: 'yearly' as const, priority: 0.5 },
    { path: '/terms', frequency: 'yearly' as const, priority: 0.5 },
    { path: '/safety', frequency: 'monthly' as const, priority: 0.7 },
    { path: '/support', frequency: 'monthly' as const, priority: 0.7 },
  ]

  const staticPages: MetadataRoute.Sitemap = staticPageConfig.map((page) => ({
    url: `${siteConfig.url}${page.path}`,
    lastModified: siteReleaseDate,
    changeFrequency: page.frequency,
    priority: page.priority,
  }))

  const articlePages: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${siteConfig.url}/blog/${article.slug}`,
    lastModified: new Date(article.updatedAt),
    changeFrequency: 'monthly',
    priority: article.category.slug === 'responsible-medicine-use' ? 0.85 : 0.8,
  }))

  const categories = new Map(
    articles.map((article) => [article.category.slug, article.category]),
  )

  const categoryPages: MetadataRoute.Sitemap = Array.from(categories.values()).map(
    (category) => {
      const latestCategoryUpdate = articles
        .filter((article) => article.category.slug === category.slug)
        .reduce(
          (latest, article) =>
            new Date(article.updatedAt) > latest ? new Date(article.updatedAt) : latest,
          siteReleaseDate,
        )

      return {
        url: `${siteConfig.url}/category/${category.slug}`,
        lastModified: latestCategoryUpdate,
        changeFrequency: 'weekly',
        priority: category.slug === 'responsible-medicine-use' ? 0.8 : 0.7,
      }
    },
  )

  return [...staticPages, ...categoryPages, ...articlePages]
}
