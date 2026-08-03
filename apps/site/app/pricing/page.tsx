import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/src/components/JsonLd'
import { siteConfig } from '@/src/lib/site'

export const metadata: Metadata = {
  title: 'Free Public Edition',
  description:
    'Use BeshmarAI free in your browser with no account, OTP, subscription, or payment.',
  alternates: {
    canonical: '/pricing/',
    languages: { en: '/pricing/', fa: '/fa/pricing/' },
  },
}

const freeJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'BeshmarAI Pill Counter',
  url: siteConfig.appUrl,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  isAccessibleForFree: true,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
}

export default function PricingPage() {
  return (
    <main id="main" className="locale-en">
      <JsonLd data={freeJsonLd} />
      <section className="page-hero pricing-hero-v31">
        <div className="container narrow">
          <span className="badge"><i /> Free public edition</span>
          <h1>No sign-in. No subscription. Run it directly in your browser.</h1>
          <p>
            The public edition is free to use. Counting images stay on the
            device and model inference runs locally.
          </p>
        </div>
      </section>
      <section className="section pricing-section-v31">
        <div className="container">
          <div className="availability-banner-v31" role="status">
            <span aria-hidden="true">✓</span>
            <div>
              <strong>Usage cost: zero</strong>
              <p>No account, phone number, OTP, order, payment, or renewal.</p>
            </div>
          </div>
          <article className="free-card-v31">
            <div>
              <span className="kicker-v3">BeshmarAI Free</span>
              <h2>Local counting with models cached on your device</h2>
              <p>
                On first use, required assets are downloaded and stored by the
                browser. Supported PWA capabilities can then serve repeat use
                and offline operation.
              </p>
            </div>
            <a className="button primary" href={siteConfig.appUrl}>
              Start counting free <span aria-hidden="true">→</span>
            </a>
          </article>
          <p className="pricing-note-v31">
            AI output is assistive and must be reviewed. Read the{' '}
            <Link href="/safety/">safety guide</Link> before use.
          </p>
        </div>
      </section>
    </main>
  )
}
