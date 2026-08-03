import type { Metadata } from 'next'
import { siteConfig } from '@/src/lib/site'

export const metadata: Metadata = {
  title: {
    default: 'قرص شمار | BeshmarAI — شمارش قرص با هوش مصنوعی',
    template: '%s | قرص شمار | BeshmarAI',
  },
  description: siteConfig.descriptionFa,
  alternates: {
    canonical: '/fa/',
    languages: {
      en: '/',
      fa: '/fa/',
      'x-default': '/',
    },
  },
  openGraph: {
    locale: 'fa_IR',
    alternateLocale: ['en_US'],
    title: 'قرص شمار | BeshmarAI — شمارش قرص با هوش مصنوعی',
    description: siteConfig.descriptionFa,
  },
}

export default function PersianLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="locale-fa" dir="rtl" lang="fa">
      {children}
    </div>
  )
}
