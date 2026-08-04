import type { Metadata } from 'next'
import Link from 'next/link'
import { siteConfig } from '@/src/lib/site'

export const metadata: Metadata = {
  title: 'About BeshmarAI and Contact Information',
  description:
    'Learn how the free BeshmarAI pill counter works, who maintains it, and how to contact the project for support.',
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
          <span className="badge"><i /> About BeshmarAI</span>
          <h1>Private, reviewable pill counting built to run on your device</h1>
          <p>
            {siteConfig.englishName} combines computer vision, a mobile-first
            workflow, and local browser inference to make repetitive counting
            faster while keeping a human review at the centre of the process.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container narrow article-content">
          <h2>What BeshmarAI is</h2>
          <p>
            BeshmarAI is a focused visual counting assistant for pharmacy teams,
            caregivers, researchers, and other users who need a fast suggested
            count that can still be inspected. The public edition is available
            as a browser-based Progressive Web App and does not require an
            account, phone verification, OTP, payment, or subscription.
          </p>

          <h2>How the public edition works</h2>
          <p>
            The application, ONNX Runtime assets, and verified model chunks are
            served as static files. Inference runs in the browser on the
            user&apos;s own device, using WebGPU when a stable compatible path is
            available or WebAssembly on the CPU as the compatibility route.
            Counting images are not sent to a remote image-inference endpoint.
          </p>

          <h2>Why the result remains reviewable</h2>
          <p>
            BeshmarAI presents a suggested count together with visual detections
            so the user can inspect what the model counted. Overlap, glare,
            focus, framing, camera quality, browser behaviour, and device
            performance can all affect a computer-vision result. A responsible
            human check therefore remains mandatory.
          </p>

          <h2>Who builds and maintains the project?</h2>
          <p>
            BeshmarAI and this public edition are created and maintained by{' '}
            <strong>{siteConfig.creatorName}</strong>. Product support, public
            documentation, runtime compatibility, and the public GitHub Pages
            edition are maintained through the contact channels below.
          </p>

          <div className="support-grid-v31" aria-label="BeshmarAI contact details">
            <article className="support-card-v31">
              <span aria-hidden="true">01</span>
              <h2>Creator &amp; maintainer</h2>
              <p>
                <strong>{siteConfig.creatorName}</strong><br />
                Product development and maintenance of the public edition
              </p>
            </article>

            <article className="support-card-v31">
              <span aria-hidden="true">02</span>
              <h2>Phone support</h2>
              <p>
                <a href={siteConfig.supportPhoneHref}>
                  {siteConfig.supportPhoneDisplay}
                </a><br />
                For product and technical support
              </p>
            </article>

            <article className="support-card-v31">
              <span aria-hidden="true">03</span>
              <h2>Email support</h2>
              <p>
                <a href={`mailto:${siteConfig.supportEmail}`}>
                  {siteConfig.supportEmail}
                </a><br />
                Include your device, browser, and exact error message
              </p>
            </article>
          </div>

          <h2>Profiles and project links</h2>
          <p>
            Visit the creator&apos;s{' '}
            <a href={siteConfig.githubProfileUrl} target="_blank" rel="noreferrer">
              GitHub profile
            </a>{' '}
            and{' '}
            <a href={siteConfig.linkedinUrl} target="_blank" rel="noreferrer">
              LinkedIn profile
            </a>
            , review the public source in the{' '}
            <a href={siteConfig.githubUrl} target="_blank" rel="noreferrer">
              BeshmarAI-Free repository
            </a>
            , or open the{' '}
            <a href={siteConfig.appUrl}>pill-counting application</a>.
          </p>

          <h2>Public source and private boundary</h2>
          <p>
            The public source is intentionally separated from the private
            platform. It excludes the private backend, database, mobile-number
            authentication, OTP, payment, subscription, administration systems,
            production credentials, private telemetry, and private Git history.
          </p>

          <h2>Safety before operational use</h2>
          <p>
            BeshmarAI does not identify medicine, prescribe treatment, verify a
            dose, or replace professional and legal procedures. Read the{' '}
            <Link href="/safety">safety guide</Link> and review every result
            before using it in an operational workflow.
          </p>
        </div>
      </section>
    </main>
  )
}
