import Image from 'next/image'
import Link from 'next/link'
import type { Article } from '@/src/lib/content/types'

export function ArticleCard({
  article,
}: {
  article: Article
}) {
  return (
    <article className="article-card">
      <Link
        className="article-image"
        href={`/blog/${article.slug}`}
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
            href={`/category/${article.category.slug}`}
          >
            {article.category.name}
          </Link>
          <span>{article.readingMinutes.toLocaleString('fa-IR')} دقیقه</span>
        </div>

        <h2>
          <Link href={`/blog/${article.slug}`}>
            {article.title}
          </Link>
        </h2>

        <p>{article.excerpt}</p>

        <div className="article-meta">
          <time dateTime={article.publishedAt}>
            {new Intl.DateTimeFormat('fa-IR', {
              dateStyle: 'medium',
            }).format(new Date(article.publishedAt))}
          </time>
          <Link className="article-read-more" href={`/blog/${article.slug}`}>
            مطالعه
            <span aria-hidden="true">←</span>
          </Link>
        </div>
      </div>
    </article>
  )
}
