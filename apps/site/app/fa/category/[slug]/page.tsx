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

type CategoryPageProps = {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  const articles = await getArticles('fa')
  const slugs = new Set(articles.map((article) => article.category.slug))

  return Array.from(slugs).map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const articles = await getArticles('fa')
  const category = articles.find(
    (article) => article.category.slug === slug,
  )?.category

  if (!category) {
    return {
      title: 'دسته‌بندی پیدا نشد',
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  return {
    title: category.name,
    description: category.description,
    alternates: {
      canonical: `/fa/category/${category.slug}/`,
    },
    openGraph: {
      type: 'website',
      locale: 'fa_IR',
      url: `${siteConfig.url}/fa/category/${category.slug}`,
      title: `${category.name} | مجله قرص شمار`,
      description: category.description,
      images: [
        {
          url:
            slug === 'pill-counting'
              ? '/images/category-pill-counting-v23.png'
              : '/images/og-default.png',
          alt: category.name,
        },
      ],
    },
  }
}

export default async function CategoryPage({
  params,
}: CategoryPageProps) {
  const { slug } = await params
  const articles = (await getArticles('fa')).filter(
    (article) => article.category.slug === slug,
  )

  if (!articles.length) {
    notFound()
  }

  const category = articles[0].category
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
      name: category.name,
      url: `${siteConfig.url}/fa/category/${category.slug}`,
    },
  ])

  return (
    <main id="main">
      <JsonLd data={breadcrumb} />

      <section className="page-hero">
        <div className="container category-hero-grid">
          <div className="category-hero-copy">
            <nav className="breadcrumbs" aria-label="مسیر صفحه">
              <Link href="/fa/">خانه</Link>
              <span>/</span>
              <Link href="/fa/blog">مجله</Link>
            </nav>
            <span className="badge">
              <i /> دسته‌بندی
            </span>
            <h1>{category.name}</h1>
            <p>{category.description}</p>
          </div>

          <div className="category-hero-visual">
            <Image
              src={
                slug === 'pill-counting'
                  ? '/images/category-pill-counting-v23.png'
                  : '/images/og-default.png'
              }
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
          {articles.map((article) => (
            <ArticleCard locale="fa" article={article} key={article.id} />
          ))}
        </div>
      </section>
    </main>
  )
}
