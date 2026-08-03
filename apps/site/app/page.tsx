import Image from 'next/image'
import Link from 'next/link'
import { ArticleCard } from '@/src/components/ArticleCard'
import { JsonLd } from '@/src/components/JsonLd'
import { getArticles } from '@/src/lib/content'
import { faqJsonLd } from '@/src/lib/seo'
import { siteConfig } from '@/src/lib/site'

const steps = [
  {
    number: '01',
    title: 'Spread the pills',
    description:
      'Place the pills on a clean, contrasting surface and frame the counting area with your camera.',
  },
  {
    number: '02',
    title: 'Let on-device AI count',
    description:
      'BeshmarAI analyzes the image locally with the best available GPU or CPU strategy for your device.',
  },
  {
    number: '03',
    title: 'Review the result',
    description:
      'Inspect the suggested count and detection markers, then confirm it or repeat the count when needed.',
  },
]

const aiBenefits = [
  'Private inference: counting images stay on your device',
  'Automatic, GPU/WebGPU, or CPU/WebAssembly execution',
  'Accurate final model with reviewable detection markers',
  'Installable PWA with cached models for repeat use',
]

const faqItems = [
  {
    question: 'Are pill images uploaded to a server?',
    answer:
      'No. Model inference runs in your browser and the counting image is not uploaded to a BeshmarAI backend.',
  },
  {
    question: 'Is the public edition really free?',
    answer:
      'Yes. The public edition requires no account, phone number, OTP, payment, or subscription.',
  },
  {
    question: 'Can I choose CPU or GPU?',
    answer:
      'Yes. Automatic mode is recommended, while the settings screen also lets advanced users prefer WebGPU or CPU/WebAssembly and choose a CPU thread count.',
  },
  {
    question: 'Can it work offline?',
    answer:
      'After the application and model assets have been cached, supported browser features can continue to work without a network connection.',
  },
  {
    question: 'Does the AI result replace human verification?',
    answer:
      'No. BeshmarAI is an assistive counting tool. The user remains responsible for reviewing and confirming every result.',
  },
]

const softwareApplicationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'BeshmarAI Pill Counter',
  alternateName: siteConfig.persianName,
  description: siteConfig.description,
  url: siteConfig.appUrl,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Android, iOS, Windows, macOS, Linux',
  inLanguage: ['en', 'fa'],
  isAccessibleForFree: true,
  featureList: aiBenefits,
}

export default async function HomePage() {
  const articles = (await getArticles('en')).slice(0, 3)

  return (
    <main id="main" className="locale-en">
      <JsonLd data={softwareApplicationJsonLd} />
      <JsonLd data={faqJsonLd(faqItems)} />

      <section className="hero-v3">
        <div className="hero-grid-pattern-v3" aria-hidden="true" />
        <div className="container hero-grid-v3">
          <div className="hero-copy-v3">
            <span className="eyebrow-v3">
              <span className="eyebrow-dot-v3" />
              Private AI assistance for pharmacy teams
            </span>

            <h1>
              Count pills with
              <br className="mobile-title-break-v42" />{' '}
              on-device AI.
              <span>Fast, private, and reviewable.</span>
            </h1>

            <p className="hero-lead-v3">
              Point your phone at the pills and get a suggested count in
              seconds. BeshmarAI runs the model on your device, supports both
              GPU and CPU strategies, and keeps the final decision in your
              hands.
            </p>

            <div className="hero-actions-v3">
              <a className="button primary button-glow-v3" href={siteConfig.appUrl}>
                Open the free app
                <span aria-hidden="true">→</span>
              </a>
              <a className="button secondary" href="#how-it-works">
                See how it works
              </a>
            </div>

            <div className="hero-trust-v3" aria-label="Core product features">
              <span>On-device inference</span>
              <span>English + فارسی</span>
              <span>No account</span>
              <span>Installable PWA</span>
            </div>
          </div>

          <div className="hero-visual-v3" aria-label="BeshmarAI pill-counting preview">
            <div className="hero-orbit-v3" aria-hidden="true" />
            <div className="hero-image-v3">
              <Image
                src="/images/hero-visual-v23.png"
                alt="A pharmacy technician using BeshmarAI to count pills with a phone camera"
                fill
                priority
                sizes="(max-width: 940px) 100vw, 48vw"
              />
              <div className="scan-beam-v3" aria-hidden="true" />
              <span className="detection-point-v3 point-one-v3" aria-hidden="true" />
              <span className="detection-point-v3 point-two-v3" aria-hidden="true" />
              <span className="detection-point-v3 point-three-v3" aria-hidden="true" />
            </div>

            <div className="vision-status-v3">
              <span className="live-dot-v3" />
              <div>
                <small>On-device analysis</small>
                <strong>Result ready for review</strong>
              </div>
            </div>

            <div className="result-card-v3">
              <div>
                <small>Example result</small>
                <strong>48</strong>
                <span>pills detected</span>
              </div>
              <div className="result-pills-v3" aria-hidden="true">
                {Array.from({ length: 9 }).map((_, index) => (
                  <i key={index} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="facts-bar-v3" aria-label="Product facts">
        <div className="container facts-grid-v3">
          <div><strong>Private</strong><span>Images stay on-device</span></div>
          <div><strong>Adaptive</strong><span>GPU or CPU execution</span></div>
          <div><strong>Free</strong><span>No sign-in or payment</span></div>
          <div><strong>Cross-platform</strong><span>Mobile and desktop PWA</span></div>
        </div>
      </section>

      <section className="section-v3 steps-section-v3" id="how-it-works">
        <div className="container">
          <div className="section-heading-v3 centered-v3">
            <span className="kicker-v3">Simple from the first count</span>
            <h2>Three steps to a clear, reviewable result</h2>
            <p>
              The workflow stays short so pharmacy professionals can focus on
              verification rather than software complexity.
            </p>
          </div>

          <div className="steps-grid-v3">
            {steps.map((step) => (
              <article className="step-card-v3" key={step.number}>
                <span className="step-number-v3">{step.number}</span>
                <div className="step-icon-v3" aria-hidden="true"><span /></div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-v3 ai-showcase-v3" id="features">
        <div className="container ai-showcase-grid-v3">
          <div className="ai-showcase-copy-v3">
            <span className="kicker-v3">AI designed for real devices</span>
            <h2>Automatic performance, with expert controls when you need them</h2>
            <p>
              BeshmarAI profiles the device once and selects a stable execution
              plan. Advanced users can explicitly prefer WebGPU or CPU and
              reset the saved strategy at any time.
            </p>

            <ul className="benefit-list-v3">
              {aiBenefits.map((benefit) => (
                <li key={benefit}><span aria-hidden="true">✓</span>{benefit}</li>
              ))}
            </ul>

            <a className="text-link-v3" href={siteConfig.appUrl}>
              Try BeshmarAI <span aria-hidden="true">→</span>
            </a>
          </div>

          <div className="ai-showcase-visual-v3">
            <div className="ai-image-frame-v3">
              <Image
                src="/images/on-device-ai-v23.png"
                alt="On-device AI architecture for private pill counting"
                fill
                sizes="(max-width: 940px) 100vw, 46vw"
              />
            </div>
            <div className="ai-signal-v3 signal-one-v3" aria-hidden="true" />
            <div className="ai-signal-v3 signal-two-v3" aria-hidden="true" />
            <div className="ai-mini-card-v3">
              <span>Automatic • WebGPU • CPU</span>
              <strong>Choose the strategy in Settings</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="section-v3 trust-section-v31" aria-labelledby="trust-title">
        <div className="container trust-grid-v31">
          <div className="trust-copy-v31">
            <span className="kicker-v3">Privacy by architecture</span>
            <h2 id="trust-title">The counting image stays on your device</h2>
            <p>
              The public edition has no account, OTP, payment flow, private
              backend, or image-upload inference endpoint. Application and model
              files are delivered statically and run in the browser.
            </p>
            <div className="trust-points-v31">
              <article><span aria-hidden="true">01</span><div><strong>Local inference</strong><p>Camera frames remain inside the browser session.</p></div></article>
              <article><span aria-hidden="true">02</span><div><strong>Open public source</strong><p>The free edition can be audited on GitHub.</p></div></article>
              <article><span aria-hidden="true">03</span><div><strong>Human review</strong><p>Every result is a suggestion that must be confirmed.</p></div></article>
            </div>
          </div>
          <div className="privacy-panel-v31">
            <span className="privacy-orbit-v31" aria-hidden="true" />
            <strong>On-device only</strong>
            <p>No image upload for model inference</p>
            <Link className="text-link-v3" href="/privacy">Read the privacy policy →</Link>
          </div>
        </div>
      </section>

      <section className="section-v3 articles-section-v3">
        <div className="container">
          <div className="section-heading-v3 section-heading-row-v3">
            <div>
              <span className="kicker-v3">Practical pharmacy insights</span>
              <h2>Counting, workflow, safety, and responsible medicine use</h2>
            </div>
            <Link className="text-link-v3" href="/blog">View all articles →</Link>
          </div>
          <div className="articles-grid">
            {articles.map((article) => (
              <ArticleCard article={article} key={article.id} locale="en" />
            ))}
          </div>
        </div>
      </section>

      <section className="section-v3 faq-section-v3">
        <div className="container faq-grid-v3">
          <div className="section-heading-v3">
            <span className="kicker-v3">Frequently asked questions</span>
            <h2>What to know before your first count</h2>
            <p>Review the safety guide and repeat any count that looks uncertain.</p>
          </div>
          <div className="faq-list-v3">
            {faqItems.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="final-cta-v3">
        <div className="container final-cta-inner-v3">
          <div>
            <span className="kicker-v3">Free public edition</span>
            <h2>Ready to test a private AI pill counter?</h2>
            <p>No account. No subscription. English and Persian included.</p>
          </div>
          <div className="hero-actions-v3">
            <a className="button primary button-glow-v3" href={siteConfig.appUrl}>Open the app →</a>
            <Link className="button secondary" href="/safety">Read the safety guide</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
