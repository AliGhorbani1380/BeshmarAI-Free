import type { Metadata } from 'next'
import Link from 'next/link'
import { siteConfig } from '@/src/lib/site'

export const metadata: Metadata = {
  title: 'About the Free BeshmarAI Pill Counter',
  description:
    'How the open, free BeshmarAI edition delivers private on-device AI pill counting without accounts or image uploads.',
  alternates: {
    canonical: '/about/',
    languages: { en: '/about/', fa: '/fa/about/' },
  },
}

export default function AboutPage() {
  return (
    <main id="main" className="locale-en">
      <section className="page-hero">
        <div className="container narrow">
          <span className="badge"><i /> About the product</span>
          <h1>On-device AI for faster, more reviewable pill counting</h1>
          <p>
            {siteConfig.englishName} is a focused visual counting assistant for
            pharmacy teams, available as a browser-based progressive web app.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container narrow article-content">
          <h2>How the public edition works</h2>
          <p>
            The application, ONNX Runtime assets, and chunked models are served
            as static files. Inference runs in the browser on the user&apos;s own
            device, using WebGPU when suitable or WebAssembly on the CPU.
          </p>

          <h2>No account or private backend</h2>
          <p>
            The free edition has no phone login, OTP, subscription, checkout,
            administration panel, database, or image-upload inference endpoint.
          </p>

          <h2>Human verification remains essential</h2>
          <p>
            BeshmarAI provides a suggested count. It does not replace pharmacy
            procedures, professional judgment, legal obligations, or a final
            human check.
          </p>

          <h2>Open public source</h2>
          <p>
            The public source is separated from the private platform and can be
            reviewed on <a href={siteConfig.githubUrl}>GitHub</a>. See the{' '}
            <Link href="/safety">safety guide</Link> before operational use.
          </p>
        </div>
      </section>
    </main>
  )
}
