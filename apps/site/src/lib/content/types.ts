export type ArticleSection = {
  heading: string
  paragraphs?: string[]
  bullets?: string[]
}

export type Author = {
  name: string
  slug: string
  role: string
  bio: string
}

export type Category = {
  name: string
  slug: string
  description: string
}

export type Article = {
  id: string
  slug: string
  title: string
  excerpt: string
  description: string
  category: Category
  tags: string[]
  primaryKeyword: string
  searchIntent: 'informational' | 'commercial' | 'navigational'
  author: Author
  reviewer?: Author
  publishedAt: string
  updatedAt: string
  readingMinutes: number
  coverImage: string
  coverAlt: string
  sections: ArticleSection[]
  faq?: Array<{
    question: string
    answer: string
  }>
  sources?: Array<{
    title: string
    url: string
  }>
}
