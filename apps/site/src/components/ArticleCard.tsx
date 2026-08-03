import Image from 'next/image'
import Link from 'next/link'
import type { Article } from '@/src/lib/content/types'
import type { ContentLocale } from '@/src/lib/content'

export function ArticleCard({
  article,
  locale = 'en',
}: {
  article: Article
  locale?: ContentLocale
}) {
  const prefix =
    locale === 'fa'
      ? '/fa'
      : ''

  const numberLocale =
    locale === 'fa'
      ? 'fa-IR'
      : 'en-US'

  const readingLabel =
    locale === 'fa'
      ? 'دقیقه'
      : 'min read'

  const readLabel =
    locale === 'fa'
      ? 'مطالعه'
      : 'Read article'

  const arrow =
    locale === 'fa'
      ? '←'
      : '→'

  return (
    <article className="article-card">
      <Link
        className="article-image"
        href={`${prefix}/blog/${article.slug}`}
        aria-label={article.title}
      >
        <Image
          src={article.coverImage}
          alt={article.coverAlt}
          fill
          sizes="(max-width: 760px) 100vw, 33vw"
        />
        <span className="article-image-shade" />
      </Link>

      <div className="article-card-body">
        <div className="article-card-topline">
          <Link
            className="category-label"
            href={`${prefix}/category/${article.category.slug}`}
          >
            {article.category.name}
          </Link>
          <span>
            {article.readingMinutes.toLocaleString(numberLocale)}
            {' '}
            {readingLabel}
          </span>
        </div>

        <h2>
          <Link href={`${prefix}/blog/${article.slug}`}>
            {article.title}
          </Link>
        </h2>

        <p>{article.excerpt}</p>

        <div className="article-meta">
          <time dateTime={article.publishedAt}>
            {new Intl.DateTimeFormat(numberLocale, {
              dateStyle: 'medium',
            }).format(new Date(article.publishedAt))}
          </time>
          <Link
            className="article-read-more"
            href={`${prefix}/blog/${article.slug}`}
          >
            {readLabel}
            <span aria-hidden="true">{arrow}</span>
          </Link>
        </div>
      </div>
    </article>
  )
}
