import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArticleCard } from '@/src/components/ArticleCard'
import { JsonLd } from '@/src/components/JsonLd'
import { getArticles } from '@/src/lib/content'
import { breadcrumbJsonLd } from '@/src/lib/seo'
import { siteConfig } from '@/src/lib/site'

export const dynamicParams = false

type CategoryPageProps = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const articles = await getArticles('en')
  return Array.from(new Set(articles.map((article) => article.category.slug))).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const articles = await getArticles('en')
  const category = articles.find((article) => article.category.slug === slug)?.category

  if (!category) return { title: 'Category not found', robots: { index: false, follow: false } }

  return {
    title: category.name,
    description: category.description,
    alternates: {
      canonical: `/category/${category.slug}/`,
      languages: {
        en: `/category/${category.slug}/`,
        fa: `/fa/category/${category.slug}/`,
      },
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      alternateLocale: ['fa_IR'],
      url: `${siteConfig.url}/category/${category.slug}`,
      title: `${category.name} | BeshmarAI Insights`,
      description: category.description,
      images: [{
        url: slug === 'pill-counting' ? '/images/category-pill-counting-v23.png' : '/images/og-default.png',
        alt: category.name,
      }],
    },
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const articles = (await getArticles('en')).filter((article) => article.category.slug === slug)
  if (!articles.length) notFound()

  const category = articles[0].category
  const breadcrumb = breadcrumbJsonLd([
    { name: 'Home', url: siteConfig.url },
    { name: 'Insights', url: `${siteConfig.url}/blog` },
    { name: category.name, url: `${siteConfig.url}/category/${category.slug}` },
  ])

  return (
    <main id="main" className="locale-en">
      <JsonLd data={breadcrumb} />
      <section className="page-hero">
        <div className="container category-hero-grid">
          <div className="category-hero-copy">
            <nav className="breadcrumbs" aria-label="Breadcrumb">
              <Link href="/">Home</Link><span>/</span><Link href="/blog">Insights</Link>
            </nav>
            <span className="badge"><i /> Category</span>
            <h1>{category.name}</h1><p>{category.description}</p>
          </div>
          <div className="category-hero-visual">
            <Image
              src={slug === 'pill-counting' ? '/images/category-pill-counting-v23.png' : '/images/og-default.png'}
              alt={category.name}
              width={1600}
              height={1000}
              priority
              sizes="(max-width: 930px) 100vw, 42vw"
            />
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container articles-grid">
          {articles.map((article) => <ArticleCard article={article} key={article.id} locale="en" />)}
        </div>
      </section>
    </main>
  )
}
