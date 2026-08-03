import { siteConfig } from '@/src/lib/site'

export const dynamic = 'force-static'
export function GET() {
  const body = `# ${siteConfig.name} (${siteConfig.englishName})

> A Persian on-device AI pill-counting product for pharmacies and pharmacy technicians.

## Product
- Website: ${siteConfig.url}
- Web application: ${siteConfig.appUrl}
- Pill images used for counting are processed on the user's device and are not sent to a server for model inference.
- The result is assistive and must be reviewed by the user.

## Key pages
- Product overview: ${siteConfig.url}/
- Campaign: ${siteConfig.url}/campaign
- Free public version: ${siteConfig.url}/pricing
- Safety: ${siteConfig.url}/safety
- Privacy: ${siteConfig.url}/privacy
- Support: ${siteConfig.url}/support
- Editorial content: ${siteConfig.url}/blog
- RSS: ${siteConfig.url}/feed.xml
- Sitemap: ${siteConfig.url}/sitemap.xml

## Campaign
The "Ham-andazeh Niyaz" campaign advocates medicine quantities and packaging that better match genuine patient need while preserving prescription accuracy, medicine safety, stability, authenticity, and traceability. It does not encourage changing or stopping prescribed treatment.

## Editorial policy
Content is written in Persian for people and pharmacy professionals. The public application requires no account, OTP, payment, or subscription. Medical and disposal guidance should be checked against official local health-authority instructions.
`

  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
