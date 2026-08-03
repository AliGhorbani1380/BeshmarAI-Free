import { getArticles } from '@/src/lib/content'
import { siteConfig } from '@/src/lib/site'

export const dynamic = 'force-static'
function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

export async function GET() {
  // BESHMARAI_SITE_EDITORIAL_SEO_COMPLETION_V2_2
  const articles = await getArticles()

  const lastBuildDate = articles.reduce(
    (latest, article) =>
      new Date(article.updatedAt) > latest ? new Date(article.updatedAt) : latest,
    new Date('2026-07-20T08:00:00+03:30'),
  )

  const items = articles
    .map((article) => {
      const url = `${siteConfig.url}/blog/${article.slug}`

      return [
        '<item>',
        `<title>${escapeXml(article.title)}</title>`,
        `<link>${escapeXml(url)}</link>`,
        `<guid isPermaLink="true">${escapeXml(url)}</guid>`,
        `<description>${escapeXml(article.description)}</description>`,
        `<pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>`,
        `<category>${escapeXml(article.category.name)}</category>`,
        '</item>',
      ].join('')
    })
    .join('')

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    '<channel>',
    `<title>${escapeXml(siteConfig.name)} | فناوری داروخانه و مصرف مسئولانه</title>`,
    `<link>${escapeXml(siteConfig.url)}</link>`,
    '<description>راهنماهای شمارش قرص، فناوری داروخانه، پسماند دارویی و مصرف مسئولانه دارو</description>',
    '<language>fa-IR</language>',
    `<lastBuildDate>${lastBuildDate.toUTCString()}</lastBuildDate>`,
    `<atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${escapeXml(
      `${siteConfig.url}/feed.xml`,
    )}" rel="self" type="application/rss+xml" />`,
    items,
    '</channel>',
    '</rss>',
  ].join('')

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control':
        'public, max-age=0, s-maxage=900, stale-while-revalidate=86400',
    },
  })
}
