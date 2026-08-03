import type { Metadata, Viewport } from 'next'
import '@fontsource-variable/vazirmatn/wght.css'
import '@fontsource/estedad/700.css'
import '@fontsource/estedad/800.css'
import '@fontsource/estedad/900.css'
import './globals.css'
import { Footer } from '@/src/components/Footer'
import { Header } from '@/src/components/Header'
import { JsonLd } from '@/src/components/JsonLd'
import { LocaleSkipLink } from '@/src/components/LocaleSkipLink'
import { organizationJsonLd, websiteJsonLd } from '@/src/lib/seo'
import { siteConfig } from '@/src/lib/site'

const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: 'BeshmarAI — Free On-Device AI Pill Counter',
    template: '%s | BeshmarAI',
  },
  description: siteConfig.description,
  applicationName: 'BeshmarAI Pill Counter',
  authors: [{ name: 'BeshmarAI', url: siteConfig.url }],
  creator: 'BeshmarAI',
  publisher: 'BeshmarAI',
  category: 'Pharmacy technology and digital health',
  keywords: [
    'pill counter',
    'AI pill counting',
    'pharmacy technician',
    'on-device AI',
    'private pill counter',
    'WebGPU pill counting',
    'offline PWA',
  ],
  manifest: '/manifest.webmanifest',
  alternates: {
    canonical: '/',
    languages: {
      en: '/',
      fa: '/fa/',
      'x-default': '/',
    },
    types: { 'application/rss+xml': '/feed.xml' },
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
  formatDetection: { telephone: false, email: false, address: false },
  ...(googleVerification
    ? { verification: { google: googleVerification } }
    : {}),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['fa_IR'],
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: 'BeshmarAI — Free On-Device AI Pill Counter',
    description: siteConfig.description,
    images: [
      {
        url: '/images/og-default.png',
        width: 1200,
        height: 630,
        alt: 'BeshmarAI on-device AI pill counter',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BeshmarAI — Free On-Device AI Pill Counter',
    description: siteConfig.description,
    images: ['/images/og-default.png'],
  },
  icons: {
    icon: [
      { url: '/brand/site/favicon.ico', sizes: 'any' },
      { url: '/brand/site/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/site/site-icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/brand/site/favicon.ico',
    apple: [
      { url: '/brand/site/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'dark',
  themeColor: '#02080b',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var fa=location.pathname==='/fa'||location.pathname.indexOf('/fa/')===0;document.documentElement.lang=fa?'fa':'en';document.documentElement.dir=fa?'rtl':'ltr';})();`,
          }}
        />
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <LocaleSkipLink />
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  )
}
