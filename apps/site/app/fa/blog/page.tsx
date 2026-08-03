import type { Metadata } from 'next'
import { ArticleCard } from '@/src/components/ArticleCard'
import { getArticles } from '@/src/lib/content'

export const metadata: Metadata = {
  title: 'مجله فناوری داروخانه و مصرف مسئولانه دارو',
  description:
    'آموزش شمارش قرص، فناوری داروخانه، داروی بلااستفاده، بسته‌بندی دارو و مصرف مسئولانه.',
  alternates: {
    canonical: '/fa/blog',
  },
}

export const revalidate = 900

export default async function BlogPage() {
  const articles = await getArticles('fa')

  return (
    <main id="main">
      <section className="page-hero">
        <div className="container">
          <span className="badge"><i /> مجله تخصصی قرص شمار</span>
          <h1>راهنمای حرفه‌ای داروخانه و مصرف مسئولانه دارو</h1>
          <p>
            راهنماهای منبع‌دار درباره شمارش قرص، فناوری داروخانه، داروی
            بلااستفاده، بسته‌بندی و مصرف منطقی دارو.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container articles-grid">
          {articles.map((article) => (
            <ArticleCard locale="fa" article={article} key={article.id} />
          ))}
        </div>
      </section>
    </main>
  )
}
