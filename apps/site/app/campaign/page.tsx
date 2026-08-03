import type { Metadata } from 'next'
import Link from 'next/link'
import { CampaignShare } from '@/src/components/CampaignShare'
import { JsonLd } from '@/src/components/JsonLd'
import { breadcrumbJsonLd, campaignJsonLd } from '@/src/lib/seo'
import { siteConfig } from '@/src/lib/site'

export const metadata: Metadata = {
  title: 'Right-Sized Medicine Campaign',
  description:
    'A public campaign to reduce unused medicine and avoidable packaging while preserving prescription accuracy, medicine safety, quality, authenticity, and traceability.',
  alternates: {
    canonical: '/campaign/',
    languages: { en: '/campaign/', fa: '/fa/campaign/' },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['fa_IR'],
    url: siteConfig.campaignUrl,
    title: 'Medicine matched to need; packaging matched to necessity',
    description:
      'A responsible demand for less unused medicine and unnecessary packaging without compromising care.',
    images: [{ url: '/images/og-default.png', width: 1200, height: 630, alt: 'Right-Sized Medicine Campaign by BeshmarAI' }],
  },
}

const principles = [
  {
    number: '01',
    title: 'The prescription and safety come first',
    description:
      'The campaign never encourages patients to reduce, stop, or change prescribed medicine without a physician or pharmacist.',
  },
  {
    number: '02',
    title: 'Package sizes should be more flexible',
    description:
      'Where regulation, quality, and traceability permit, dispensed quantities should more closely match the prescribed course and genuine patient need.',
  },
  {
    number: '03',
    title: 'Safe return must be accessible',
    description:
      'Unused medicine should not be accumulated, shared, flushed, or discarded casually. Official take-back guidance should be easy to find.',
  },
  {
    number: '04',
    title: 'Sustainability cannot weaken quality',
    description:
      'Material reduction and recyclability must preserve stability, tamper evidence, authenticity, labeling, and supply-chain traceability.',
  },
]

const actions = [
  'Ask whether the prescribed quantity and package size match the treatment course.',
  'Never share prescription medicine with another person.',
  'Store medicine exactly as labeled and keep it away from children.',
  'Use official local guidance for returning or disposing of unused medicine.',
  'Support packaging innovation that preserves safety and traceability.',
]

export default function CampaignPage() {
  const breadcrumb = breadcrumbJsonLd([
    { name: 'Home', url: siteConfig.url },
    { name: 'Right-Sized Medicine Campaign', url: siteConfig.campaignUrl },
  ])

  return (
    <main id="main" className="campaign-page-v4 locale-en">
      <JsonLd data={campaignJsonLd('en')} />
      <JsonLd data={breadcrumb} />

      <section className="campaign-hero-v4">
        <div className="campaign-grid-v4" aria-hidden="true" />
        <div className="container campaign-hero-grid-v4">
          <div className="campaign-hero-copy-v4">
            <span className="campaign-kicker-v4">A public-interest campaign by BeshmarAI</span>
            <h1>Medicine matched to need.<br /><span>Packaging matched to necessity.</span></h1>
            <p>
              Unused medicines create safety, cost, and environmental burdens.
              We advocate better quantity matching, accessible take-back systems,
              and smarter packaging—without weakening treatment or medicine quality.
            </p>
            <CampaignShare locale="en" />
            <div className="campaign-hero-tags-v4">
              <span>Patient safety</span><span>Less waste</span><span>Responsible packaging</span>
            </div>
          </div>
          <div className="campaign-manifesto-v4">
            <small>The campaign in one sentence</small>
            <strong>Give patients what treatment requires—no less, and no avoidable excess.</strong>
            <p>Every reform must protect the prescription, product stability, authenticity, and professional oversight.</p>
          </div>
        </div>
      </section>

      <section className="campaign-section-v4">
        <div className="container">
          <div className="campaign-section-heading-v4">
            <span>Our four principles</span>
            <h2>Reduction with guardrails, not reduction at any cost</h2>
          </div>
          <div className="campaign-principles-grid-v4">
            {principles.map((item) => (
              <article key={item.number}>
                <span>{item.number}</span><h3>{item.title}</h3><p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="campaign-section-v4 campaign-actions-section-v4">
        <div className="container campaign-actions-grid-v4">
          <div>
            <span className="campaign-kicker-v4">What people can do now</span>
            <h2>Small choices support a safer medicine system</h2>
            <p>
              Individual action is not a substitute for regulation or supply-chain
              reform, but it can reduce unsafe storage and normalize better questions.
            </p>
          </div>
          <ul>
            {actions.map((action) => <li key={action}><span aria-hidden="true">✓</span>{action}</li>)}
          </ul>
        </div>
      </section>

      <section className="campaign-final-v4">
        <div className="container campaign-final-inner-v4">
          <div>
            <span className="campaign-kicker-v4">Share a precise demand</span>
            <h2>Less unused medicine. Less avoidable packaging. No compromise on safety.</h2>
          </div>
          <div>
            <CampaignShare locale="en" />
            <Link className="campaign-text-link-v4" href="/blog/unused-medicine-at-home">
              Read the unused-medicine guide →
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
