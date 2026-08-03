import type { Metadata } from 'next'
import { siteConfig } from '@/src/lib/site'

export const metadata: Metadata = {
  title: 'Support',
  description: 'Troubleshooting and support for the free BeshmarAI pill counter.',
  alternates: {
    canonical: '/support/',
    languages: { en: '/support/', fa: '/fa/support/' },
  },
}

export default function SupportPage() {
  return (
    <main id="main" className="locale-en">
      <section className="page-hero">
        <div className="container narrow">
          <span className="badge"><i /> Support</span>
          <h1>Get the camera, model, and PWA ready</h1>
          <p>Most issues can be resolved without an account or remote support session.</p>
        </div>
      </section>
      <section className="section">
        <div className="container narrow article-content">
          <h2>The camera does not open</h2>
          <p>
            Use HTTPS, allow camera permission, close other applications using
            the camera, and reload the page. On iPhone, confirm camera access in
            Safari settings.
          </p>
          <h2>The model is downloading slowly</h2>
          <p>
            Keep the page open during the first preparation. Model chunks are
            cached after download, so later sessions should not repeat the full transfer.
          </p>
          <h2>GPU is unavailable or unstable</h2>
          <p>
            Open Settings and choose Automatic or CPU/WebAssembly. You can also
            reset the saved strategy and let BeshmarAI profile the device again.
          </p>
          <h2>Contact</h2>
          <p>
            Email <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>{' '}
            and include the device, browser version, and exact error message.
          </p>
        </div>
      </section>
    </main>
  )
}
