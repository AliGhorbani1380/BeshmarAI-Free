import type { Article } from './content/types'
import { siteConfig } from './site'

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteConfig.url}/#organization`,
    name: siteConfig.persianName,
    alternateName: siteConfig.englishName,
    description: siteConfig.description,
    url: siteConfig.url,
    logo: {
      '@type': 'ImageObject',
      url: `${siteConfig.url}/brand/site/site-icon-512x512.png`,
      contentUrl: `${siteConfig.url}/brand/site/site-icon-512x512.png`,
    },
    email: siteConfig.supportEmail,
    contactPoint: {
      '@type': 'ContactPoint',
      email: siteConfig.supportEmail,
      contactType: 'customer support',
      availableLanguage: ['fa'],
    },
    knowsAbout: [
      'شمارش قرص با هوش مصنوعی',
      'فناوری داروخانه',
      'مصرف مسئولانه دارو',
      'پسماند دارویی',
    ],
  }
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteConfig.url}/#website`,
    name: siteConfig.name,
    alternateName: siteConfig.englishName,
    description: siteConfig.description,
    url: siteConfig.url,
    inLanguage: 'fa-IR',
    publisher: {
      '@id': `${siteConfig.url}/#organization`,
    },
  }
}


export function campaignJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'پویش هم‌اندازه نیاز',
    alternateName: 'دارو به اندازه نیاز؛ بسته‌بندی به اندازه ضرورت',
    description:
      'پویش عمومی برای کاهش داروی بلااستفاده و بسته‌بندی غیرضروری با حفظ ایمنی، کیفیت و نسخه پزشک.',
    url: `${siteConfig.url}/campaign`,
    inLanguage: 'fa-IR',
    isAccessibleForFree: true,
    datePublished: '2026-07-31T00:00:00+03:30',
    dateModified: '2026-07-31T00:00:00+03:30',
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/brand/site/site-icon-512x512.png`,
      },
    },
    about: [
      { '@type': 'Thing', name: 'مصرف منطقی دارو' },
      { '@type': 'Thing', name: 'پسماند دارویی' },
      { '@type': 'Thing', name: 'بسته‌بندی پایدار دارو' },
      { '@type': 'Thing', name: 'بازگشت امن داروی بلااستفاده' },
    ],
    keywords: [
      'داروی اضافه',
      'پسماند دارویی',
      'بسته بندی دارو',
      'مصرف منطقی دارو',
      'دارو به اندازه نیاز',
    ],
  }
}

export function articleJsonLd(article: Article) {
  const articleUrl = `${siteConfig.url}/blog/${article.slug}`

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.description,
    image: [
      article.coverImage.startsWith('http')
        ? article.coverImage
        : `${siteConfig.url}${article.coverImage}`,
    ],
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    inLanguage: 'fa-IR',
    mainEntityOfPage: articleUrl,
    author: {
      '@type': 'Organization',
      name: article.author.name,
      url: `${siteConfig.url}/about`,
    },
    ...(article.reviewer
      ? {
          reviewedBy: {
            '@type': 'Person',
            name: article.reviewer.name,
            jobTitle: article.reviewer.role,
          },
        }
      : {}),
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/brand/site/site-icon-512x512.png`,
      },
    },
    ...(article.sources?.length
      ? {
          citation: article.sources.map((source) => source.url),
        }
      : {}),
  }
}

export function breadcrumbJsonLd(
  items: Array<{ name: string; url: string }>,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function faqJsonLd(
  items: NonNullable<Article['faq']>,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}
