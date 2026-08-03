import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Safety and Verification',
  description:
    'Safety guidance for using BeshmarAI as an assistive pill-counting tool.',
  alternates: {
    canonical: '/safety/',
    languages: { en: '/safety/', fa: '/fa/safety/' },
  },
}

export default function SafetyPage() {
  return (
    <main id="main" className="locale-en">
      <section className="page-hero">
        <div className="container narrow">
          <span className="badge"><i /> Safety first</span>
          <h1>Every suggested count must be reviewed by a person</h1>
          <p>BeshmarAI assists a workflow; it does not assume professional responsibility.</p>
        </div>
      </section>
      <section className="section">
        <div className="container narrow article-content">
          <h2>Prepare a clear scene</h2>
          <ul>
            <li>Use a clean, contrasting, non-reflective surface.</li>
            <li>Spread pills so heavy overlap and edge clipping are minimized.</li>
            <li>Keep the camera stable, in focus, and evenly lit.</li>
          </ul>
          <h2>Verify before acting</h2>
          <ul>
            <li>Review the number and visible detection markers.</li>
            <li>Repeat uncertain counts from a new angle or arrangement.</li>
            <li>Follow pharmacy policies, legal requirements, and professional checks.</li>
          </ul>
          <h2>Not a medical decision system</h2>
          <p>
            The application does not prescribe medicine, identify a drug,
            verify dosage, or replace a pharmacist, responsible technical
            officer, or official procedure.
          </p>
          <p><Link href="/support">Contact support</Link> for product issues.</p>
        </div>
      </section>
    </main>
  )
}
