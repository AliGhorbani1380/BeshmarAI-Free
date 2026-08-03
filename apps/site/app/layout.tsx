import type { Metadata, Viewport } from 'next'
import '@fontsource-variable/vazirmatn/wght.css'
import '@fontsource/estedad/700.css'
import '@fontsource/estedad/800.css'
import '@fontsource/estedad/900.css'
import './globals.css'
import { Footer } from '@/src/components/Footer'
import { Header } from '@/src/components/Header'
import { JsonLd } from '@/src/components/JsonLd'
import { organizationJsonLd, websiteJsonLd } from '@/src/lib/seo'
import { siteConfig } from '@/src/lib/site'

const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: 'قرص شمار | BeshmarAI — شمارش قرص با هوش مصنوعی',
    template: '%s | قرص شمار | BeshmarAI',
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [
    {
      name: siteConfig.name,
      url: siteConfig.url,
    },
  ],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  category: 'فناوری داروخانه و سلامت دیجیتال',
  keywords: [
    'شمارش قرص',
    'شمارش قرص با دوربین',
    'هوش مصنوعی داروخانه',
    'تکنسین داروخانه',
    'پسماند دارویی',
    'بسته بندی دارو',
    'مصرف منطقی دارو',
  ],
  manifest: '/manifest.webmanifest',
  alternates: {
    canonical: '/',
    types: {
      'application/rss+xml': '/feed.xml',
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  ...(googleVerification
    ? {
        verification: {
          google: googleVerification,
        },
      }
    : {}),
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: 'قرص شمار | BeshmarAI — شمارش قرص با هوش مصنوعی',
    description: siteConfig.description,
    images: [
      {
        url: '/images/og-default.png',
        width: 1200,
        height: 630,
        alt: 'قرص شمار | BeshmarAI؛ شمارش قرص با هوش مصنوعی برای داروخانه',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'قرص شمار | BeshmarAI — شمارش قرص با هوش مصنوعی',
    description: siteConfig.description,
    images: ['/images/og-default.png'],
  },
  icons: {
    icon: [
      {
        url: '/brand/site/favicon.ico',
        sizes: 'any',
      },
      {
        url: '/brand/site/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/brand/site/site-icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
    shortcut: '/brand/site/favicon.ico',
    apple: [
      {
        url: '/brand/site/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'dark',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#02080b' },
    { media: '(prefers-color-scheme: light)', color: '#02080b' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <a className="skip-link" href="#main">
          پرش به محتوای اصلی
        </a>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  )
}
