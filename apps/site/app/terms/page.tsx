import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'Terms for the free public BeshmarAI pill-counting edition.',
  alternates: {
    canonical: '/terms/',
    languages: { en: '/terms/', fa: '/fa/terms/' },
  },
}

export default function TermsPage() {
  return (
    <main id="main" className="locale-en">
      <section className="page-hero">
        <div className="container narrow">
          <span className="badge"><i /> Terms</span>
          <h1>Use BeshmarAI as an assistive counting tool</h1>
          <p>Using the public edition means accepting the limitations below.</p>
        </div>
      </section>
      <section className="section">
        <div className="container narrow article-content">
          <h2>No guarantee of a perfect count</h2>
          <p>
            Computer vision can be affected by overlap, lighting, focus,
            reflections, camera hardware, browser behavior, and device performance.
          </p>
          <h2>User responsibility</h2>
          <p>
            You must review every result and comply with professional, legal,
            safety, inventory, dispensing, and documentation requirements.
          </p>
          <h2>Availability</h2>
          <p>
            The free service may change, be interrupted, or stop supporting a
            device or browser. Cached files do not guarantee permanent offline availability.
          </p>
          <h2>Public source and rights</h2>
          <p>
            Public visibility of source code does not grant rights beyond the
            license and notices included in the repository.
          </p>
        </div>
      </section>
    </main>
  )
}
