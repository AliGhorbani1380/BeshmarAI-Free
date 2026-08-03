import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy',
  description:
    'Privacy architecture of the free BeshmarAI edition, including local image processing and browser storage.',
  alternates: {
    canonical: '/privacy/',
    languages: { en: '/privacy/', fa: '/fa/privacy/' },
  },
}

export default function PrivacyPage() {
  return (
    <main id="main" className="locale-en">
      <section className="page-hero">
        <div className="container narrow">
          <span className="badge"><i /> Privacy</span>
          <h1>Counting images are processed on your device</h1>
          <p>The free edition is designed to operate independently in the browser.</p>
        </div>
      </section>
      <section className="section">
        <div className="container narrow article-content">
          <h2>Camera and images</h2>
          <p>
            Camera access begins only after your permission. Frames used for
            counting are not sent to a BeshmarAI server for model inference.
          </p>
          <h2>No identity account</h2>
          <p>
            The public edition has no user account, mobile number, OTP,
            checkout, or subscription requirement.
          </p>
          <h2>Local browser storage</h2>
          <p>
            The browser can store application files, model chunks, device
            strategy, camera settings, and language preference in Cache Storage,
            IndexedDB, or Local Storage. Clearing site data removes them.
          </p>
          <h2>Static hosting logs</h2>
          <p>
            Static hosting and network providers may process ordinary technical
            request logs under their own policies. The public source contains no
            private analytics or image-upload endpoint.
          </p>
        </div>
      </section>
    </main>
  )
}
