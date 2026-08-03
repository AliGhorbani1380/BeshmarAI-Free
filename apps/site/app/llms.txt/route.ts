import { siteConfig } from '@/src/lib/site'

export const dynamic = 'force-static'

export function GET() {
  const body = `# BeshmarAI | قرص شمار

> A free bilingual, on-device AI pill counter for pharmacy teams.

## Product
- English website: ${siteConfig.url}/
- Persian website: ${siteConfig.url}/fa/
- Web application: ${siteConfig.appUrl}
- Public source: ${siteConfig.githubUrl}
- Pill images used for counting are processed on the user's device and are not uploaded for model inference.
- The result is assistive and must be reviewed by the user.

## Public-edition architecture
- Static website and PWA
- No account, phone login, OTP, payment, or subscription
- No private inference backend
- Automatic, WebGPU, and CPU/WebAssembly strategies
- English default with a Persian language switch

## Key pages
- Product overview: ${siteConfig.url}/
- Persian overview: ${siteConfig.url}/fa/
- Campaign: ${siteConfig.url}/campaign/
- Free edition: ${siteConfig.url}/pricing/
- Safety: ${siteConfig.url}/safety/
- Privacy: ${siteConfig.url}/privacy/
- Insights: ${siteConfig.url}/blog/
- RSS: ${siteConfig.url}/feed.xml
- Sitemap: ${siteConfig.url}/sitemap.xml
`

  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
