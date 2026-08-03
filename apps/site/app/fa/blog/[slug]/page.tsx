import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArticleCard } from '@/src/components/ArticleCard'
import { JsonLd } from '@/src/components/JsonLd'
import { getArticle, getArticles } from '@/src/lib/content'
import { articleJsonLd, breadcrumbJsonLd } from '@/src/lib/seo'
import { siteConfig } from '@/src/lib/site'

export const dynamicParams = false

type ArticlePageProps = {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  const articles = await getArticles('fa')

  return articles.map((article) => ({
    slug: article.slug,
  }))
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticle(slug, 'fa')

  if (!article) {
    return {
      title: 'مقاله پیدا نشد',
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  return {
    title: article.title,
    description: article.description,
    keywords: [
      article.primaryKeyword,
      ...article.tags,
    ],
    alternates: {
      canonical: `/fa/blog/${article.slug}/`,
    },
    authors: [
      {
        name: article.author.name,
        url: `${siteConfig.url}/fa/about`,
      },
    ],
    category: article.category.name,
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.description,
      url: `${siteConfig.url}/fa/blog/${article.slug}`,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [`${siteConfig.url}/fa/about`],
      section: article.category.name,
      tags: article.tags,
      images: [
        {
          url: article.coverImage,
          alt: article.coverAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.description,
      images: [article.coverImage],
    },
  }
}

export default async function ArticlePage({
  params,
}: ArticlePageProps) {
  const { slug } = await params
  const article = await getArticle(slug, 'fa')

  if (!article) {
    notFound()
  }

  const allArticles = await getArticles('fa')
  const isResponsibleMedicineArticle =
    article.category.slug === 'responsible-medicine-use'
  const sameCategory = allArticles.filter(
    (candidate) =>
      candidate.slug !== article.slug &&
      candidate.category.slug === article.category.slug,
  )
  const fallbackArticles = allArticles.filter(
    (candidate) =>
      candidate.slug !== article.slug &&
      candidate.category.slug !== article.category.slug,
  )
  const relatedArticles = [
    ...sameCategory,
    ...fallbackArticles,
  ].slice(0, 3)

  const breadcrumb = breadcrumbJsonLd([
    {
      name: 'صفحه اصلی',
      url: siteConfig.url,
    },
    {
      name: 'مجله',
      url: `${siteConfig.url}/fa/blog`,
    },
    {
      name: article.title,
      url: `${siteConfig.url}/fa/blog/${article.slug}`,
    },
  ])

  return (
    <main id="main">
      {/* BESHMARAI_SITE_EDITORIAL_SEO_COMPLETION_V2_2 */}
      <JsonLd data={articleJsonLd(article, 'fa')} />
      <JsonLd data={breadcrumb} />

      <article>
        <header className="article-hero">
          <div className="container article-header-grid">
            <div>
              <nav className="breadcrumbs" aria-label="مسیر صفحه">
                <Link href="/fa/">خانه</Link>
                <span>/</span>
                <Link href="/fa/blog">مجله</Link>
                <span>/</span>
                <Link href={`/fa/category/${article.category.slug}`}>
                  {article.category.name}
                </Link>
              </nav>

              <span className="category-label">
                {article.category.name}
              </span>

              <h1>{article.title}</h1>
              <p>{article.excerpt}</p>

              <div className="article-meta wide">
                <span>{article.author.name}</span>
                <span>
                  {article.readingMinutes.toLocaleString('fa-IR')} دقیقه مطالعه
                </span>
                <time dateTime={article.publishedAt}>
                  انتشار{' '}
                  {new Intl.DateTimeFormat('fa-IR', {
                    dateStyle: 'medium',
                  }).format(new Date(article.publishedAt))}
                </time>
                <time dateTime={article.updatedAt}>
                  به‌روزرسانی{' '}
                  {new Intl.DateTimeFormat('fa-IR', {
                    dateStyle: 'medium',
                  }).format(new Date(article.updatedAt))}
                </time>
              </div>
            </div>

            <div className="article-cover">
              <Image
                src={article.coverImage}
                alt={article.coverAlt}
                fill
                priority
                sizes="(max-width: 900px) 100vw, 44vw"
              />
            </div>
          </div>
        </header>

        <div className="container article-layout">
          <aside className="article-aside">
            <strong>در این مقاله</strong>
            {article.sections.map((section, index) => (
              <a href={`#section-${index + 1}`} key={section.heading}>
                {section.heading}
              </a>
            ))}
            {article.faq?.length ? (
              <a href="#article-faq">پرسش‌های رایج</a>
            ) : null}
            {article.sources?.length ? (
              <a href="#article-sources">منابع</a>
            ) : null}
          </aside>

          <div className="article-body">
            <div className="safety-notice">
              {isResponsibleMedicineArticle
                ? 'این مطلب برای آگاهی عمومی است و جایگزین نسخه، نظر پزشک، داروساز یا دستور رسمی دفع دارو در محل زندگی شما نیست.'
                : 'قرص شمار ابزار کمکی شمارش است و نتیجه باید توسط کاربر یا مسئول حرفه‌ای مربوطه تأیید شود.'}
            </div>

            {article.sections.map((section, index) => (
              <section id={`section-${index + 1}`} key={section.heading}>
                <h2>{section.heading}</h2>

                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}

                {section.bullets?.length ? (
                  <ul>
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}

            {article.faq?.length ? (
              <section id="article-faq">
                <h2>پرسش‌های رایج</h2>
                <div className="faq-list">
                  {article.faq.map((item) => (
                    <details key={item.question}>
                      <summary>{item.question}</summary>
                      <p>{item.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            ) : null}

            {article.sources?.length ? (
              <section id="article-sources">
                <h2>منابع</h2>
                <ul>
                  {article.sources.map((source) => (
                    <li key={source.url}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {source.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="author-box">
              <strong>{article.author.name}</strong>
              <span>{article.author.role}</span>
              <p>{article.author.bio}</p>
            </section>

            {article.reviewer ? (
              <section className="author-box">
                <strong>بازبینی: {article.reviewer.name}</strong>
                <span>{article.reviewer.role}</span>
                <p>{article.reviewer.bio}</p>
              </section>
            ) : null}
          </div>
        </div>
      </article>

      {relatedArticles.length ? (
        <section className="section alt">
          <div className="container">
            <div className="section-head split-head">
              <div>
                <span className="kicker">مطالب مرتبط</span>
                <h2>ادامه مطالعه</h2>
              </div>
              <Link className="button secondary" href="/fa/blog">
                مشاهده همه مقاله‌ها
              </Link>
            </div>

            <div className="articles-grid">
              {relatedArticles.map((related) => (
                <ArticleCard locale="fa" article={related} key={related.id} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  )
}
