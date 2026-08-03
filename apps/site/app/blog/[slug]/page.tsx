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
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const articles = await getArticles('en')
  return articles.map((article) => ({ slug: article.slug }))
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticle(slug, 'en')

  if (!article) {
    return { title: 'Article not found', robots: { index: false, follow: false } }
  }

  return {
    title: article.title,
    description: article.description,
    keywords: [article.primaryKeyword, ...article.tags],
    alternates: {
      canonical: `/blog/${article.slug}/`,
      languages: {
        en: `/blog/${article.slug}/`,
        fa: `/fa/blog/${article.slug}/`,
      },
    },
    authors: [{ name: article.author.name, url: `${siteConfig.url}/about` }],
    category: article.category.name,
    openGraph: {
      type: 'article',
      locale: 'en_US',
      alternateLocale: ['fa_IR'],
      title: article.title,
      description: article.description,
      url: `${siteConfig.url}/blog/${article.slug}`,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [`${siteConfig.url}/about`],
      section: article.category.name,
      tags: article.tags,
      images: [{ url: article.coverImage, alt: article.coverAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.description,
      images: [article.coverImage],
    },
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params
  const article = await getArticle(slug, 'en')

  if (!article) notFound()

  const allArticles = await getArticles('en')
  const relatedArticles = [
    ...allArticles.filter(
      (candidate) =>
        candidate.slug !== article.slug &&
        candidate.category.slug === article.category.slug,
    ),
    ...allArticles.filter(
      (candidate) =>
        candidate.slug !== article.slug &&
        candidate.category.slug !== article.category.slug,
    ),
  ].slice(0, 3)

  const responsible = article.category.slug === 'responsible-medicine-use'
  const breadcrumb = breadcrumbJsonLd([
    { name: 'Home', url: siteConfig.url },
    { name: 'Insights', url: `${siteConfig.url}/blog` },
    { name: article.title, url: `${siteConfig.url}/blog/${article.slug}` },
  ])

  return (
    <main id="main" className="locale-en">
      <JsonLd data={articleJsonLd(article, 'en')} />
      <JsonLd data={breadcrumb} />
      <article>
        <header className="article-hero">
          <div className="container article-header-grid">
            <div>
              <nav className="breadcrumbs" aria-label="Breadcrumb">
                <Link href="/">Home</Link><span>/</span>
                <Link href="/blog">Insights</Link><span>/</span>
                <Link href={`/category/${article.category.slug}`}>{article.category.name}</Link>
              </nav>
              <span className="category-label">{article.category.name}</span>
              <h1>{article.title}</h1>
              <p>{article.excerpt}</p>
              <div className="article-meta wide">
                <span>{article.author.name}</span>
                <span>{article.readingMinutes.toLocaleString('en-US')} min read</span>
                <time dateTime={article.publishedAt}>
                  Published {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(article.publishedAt))}
                </time>
                <time dateTime={article.updatedAt}>
                  Updated {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(article.updatedAt))}
                </time>
              </div>
            </div>
            <div className="article-cover">
              <Image src={article.coverImage} alt={article.coverAlt} fill priority sizes="(max-width: 900px) 100vw, 44vw" />
            </div>
          </div>
        </header>

        <div className="container article-layout">
          <aside className="article-aside">
            <strong>In this article</strong>
            {article.sections.map((section, index) => (
              <a href={`#section-${index + 1}`} key={section.heading}>{section.heading}</a>
            ))}
            {article.faq?.length ? <a href="#article-faq">FAQ</a> : null}
            {article.sources?.length ? <a href="#article-sources">Sources</a> : null}
          </aside>

          <div className="article-body">
            <div className="safety-notice">
              {responsible
                ? 'This article is general information and does not replace a prescription, a physician or pharmacist, or official local disposal guidance.'
                : 'BeshmarAI is an assistive counting tool. Every suggested result must be reviewed and confirmed by the responsible user.'}
            </div>

            {article.sections.map((section, index) => (
              <section id={`section-${index + 1}`} key={section.heading}>
                <h2>{section.heading}</h2>
                {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.bullets?.length ? (
                  <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
                ) : null}
              </section>
            ))}

            {article.faq?.length ? (
              <section id="article-faq">
                <h2>Frequently asked questions</h2>
                <div className="faq-list">
                  {article.faq.map((item) => (
                    <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>
                  ))}
                </div>
              </section>
            ) : null}

            {article.sources?.length ? (
              <section id="article-sources">
                <h2>Sources</h2>
                <ul>
                  {article.sources.map((source) => (
                    <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="author-box">
              <strong>{article.author.name}</strong><span>{article.author.role}</span><p>{article.author.bio}</p>
            </section>
            {article.reviewer ? (
              <section className="author-box">
                <strong>Reviewed by {article.reviewer.name}</strong><span>{article.reviewer.role}</span><p>{article.reviewer.bio}</p>
              </section>
            ) : null}
          </div>
        </div>
      </article>

      {relatedArticles.length ? (
        <section className="section alt">
          <div className="container">
            <div className="section-head split-head">
              <div><span className="kicker">Related reading</span><h2>Continue exploring</h2></div>
              <Link className="button secondary" href="/blog">All articles</Link>
            </div>
            <div className="articles-grid">
              {relatedArticles.map((related) => (
                <ArticleCard article={related} key={related.id} locale="en" />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  )
}
