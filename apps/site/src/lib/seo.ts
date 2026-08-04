import type { ContentLocale } from './content'
import type { Article } from './content/types'
import { siteConfig } from './site'

const isFa = (locale: ContentLocale) => locale === 'fa'

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteConfig.url}/#organization`,
    name: siteConfig.englishName,
    alternateName: siteConfig.persianName,
    description: siteConfig.description,
    url: siteConfig.url,
    logo: {
      '@type': 'ImageObject',
      url: `${siteConfig.url}/brand/site/site-icon-512x512.png`,
      contentUrl: `${siteConfig.url}/brand/site/site-icon-512x512.png`,
    },
    email: siteConfig.supportEmail,
    telephone: siteConfig.supportPhoneE164,
    founder: {
      '@type': 'Person',
      name: siteConfig.creatorName,
      sameAs: [siteConfig.githubProfileUrl, siteConfig.linkedinUrl],
    },
    sameAs: [
      siteConfig.githubUrl,
      siteConfig.githubProfileUrl,
      siteConfig.linkedinUrl,
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: siteConfig.supportEmail,
      telephone: siteConfig.supportPhoneE164,
      contactType: 'customer support',
      availableLanguage: ['English', 'Persian'],
    },
    knowsAbout: [
      'AI pill counting',
      'On-device artificial intelligence',
      'Pharmacy technology',
      'Responsible medicine use',
    ],
  }
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteConfig.url}/#website`,
    name: siteConfig.englishName,
    alternateName: siteConfig.persianName,
    description: siteConfig.description,
    url: siteConfig.url,
    inLanguage: ['en', 'fa'],
    publisher: {
      '@id': `${siteConfig.url}/#organization`,
    },
  }
}

export function campaignJsonLd(locale: ContentLocale = 'en') {
  const fa = isFa(locale)
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: fa ? 'پویش هم‌اندازه نیاز' : 'Right-Sized Medicine Campaign',
    alternateName: fa
      ? 'دارو به اندازه نیاز؛ بسته‌بندی به اندازه ضرورت'
      : 'Medicine matched to need; packaging matched to necessity',
    description: fa
      ? 'پویش عمومی برای کاهش داروی بلااستفاده و بسته‌بندی غیرضروری با حفظ ایمنی، کیفیت و نسخه پزشک.'
      : 'A public campaign to reduce unused medicine and unnecessary packaging while preserving prescription accuracy, safety, quality, authenticity, and traceability.',
    url: fa ? siteConfig.campaignUrlFa : siteConfig.campaignUrl,
    inLanguage: fa ? 'fa-IR' : 'en',
    isAccessibleForFree: true,
    datePublished: '2026-07-31T00:00:00+03:30',
    dateModified: '2026-08-03T00:00:00+03:30',
    publisher: {
      '@id': `${siteConfig.url}/#organization`,
    },
    about: fa
      ? [
          { '@type': 'Thing', name: 'مصرف منطقی دارو' },
          { '@type': 'Thing', name: 'پسماند دارویی' },
          { '@type': 'Thing', name: 'بسته‌بندی پایدار دارو' },
        ]
      : [
          { '@type': 'Thing', name: 'Responsible medicine use' },
          { '@type': 'Thing', name: 'Pharmaceutical waste' },
          { '@type': 'Thing', name: 'Sustainable medicine packaging' },
        ],
  }
}

export function articleJsonLd(
  article: Article,
  locale: ContentLocale = 'en',
) {
  const fa = isFa(locale)
  const prefix = fa ? '/fa' : ''
  const articleUrl = `${siteConfig.url}${prefix}/blog/${article.slug}`

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
    inLanguage: fa ? 'fa-IR' : 'en',
    mainEntityOfPage: articleUrl,
    author: {
      '@type': 'Organization',
      name: article.author.name,
      url: `${siteConfig.url}${prefix}/about`,
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
      '@id': `${siteConfig.url}/#organization`,
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
