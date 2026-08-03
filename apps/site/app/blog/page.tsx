import type { Metadata } from 'next'
import { ArticleCard } from '@/src/components/ArticleCard'
import { getArticles } from '@/src/lib/content'

export const metadata: Metadata = {
  title: 'Pharmacy Technology and Responsible Medicine Insights',
  description:
    'Practical guides to pill counting, pharmacy workflow, camera setup, unused medicine, and responsible medicine use.',
  alternates: {
    canonical: '/blog/',
    languages: { en: '/blog/', fa: '/fa/blog/' },
  },
}

export default async function BlogPage() {
  const articles = await getArticles('en')

  return (
    <main id="main" className="locale-en">
      <section className="page-hero">
        <div className="container">
          <span className="badge"><i /> BeshmarAI Insights</span>
          <h1>Practical guidance for pharmacy work and responsible medicine use</h1>
          <p>
            Source-based articles about reliable visual counting, camera setup,
            workflow checks, unused medicines, and sustainable packaging.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="container articles-grid">
          {articles.map((article) => (
            <ArticleCard article={article} key={article.id} locale="en" />
          ))}
        </div>
      </section>
    </main>
  )
}
