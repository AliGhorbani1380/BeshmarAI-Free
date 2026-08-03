import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/src/components/JsonLd'
import { siteConfig } from '@/src/lib/site'

export const metadata: Metadata = {
  title: 'نسخه رایگان قرص شمار',
  description:
    'نسخه عمومی و رایگان قرص شمار بدون ورود، OTP، پرداخت یا اشتراک؛ اجرای مدل شمارش روی دستگاه کاربر.',
  alternates: {
    canonical: '/fa/pricing/',
  },
}

const freeJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: siteConfig.name,
  url: siteConfig.appUrl,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'IRR',
  },
}

export default function PricingPage() {
  return (
    <main id="main">
      <JsonLd data={freeJsonLd} />

      <section className="page-hero pricing-hero-v31">
        <div className="container narrow">
          <span className="badge"><i /> نسخه عمومی رایگان</span>
          <h1>بدون ورود، بدون پرداخت، مستقیم در مرورگر</h1>
          <p>
            نسخه عمومی قرص شمار برای استفاده رایگان منتشر شده است. تصویر
            شمارش به سرور ارسال نمی‌شود و مدل هوش مصنوعی روی دستگاه شما
            اجرا می‌شود.
          </p>
        </div>
      </section>

      <section className="section pricing-section-v31">
        <div className="container">
          <div className="availability-banner-v31" role="status">
            <span aria-hidden="true">✓</span>
            <div>
              <strong>هزینه استفاده: صفر</strong>
              <p>
                حساب کاربری، شماره موبایل، OTP، سفارش، پرداخت و تمدید در
                نسخه عمومی وجود ندارد.
              </p>
            </div>
          </div>

          <article className="free-card-v31">
            <div>
              <span className="kicker-v3">BeshmarAI Free</span>
              <h2>شمارش محلی با مدل‌های ذخیره‌شده روی دستگاه</h2>
              <p>
                در اولین اجرا، فایل‌های لازم دانلود و در حافظه مرورگر ذخیره
                می‌شوند. پس از آماده‌سازی، برنامه تا حد پشتیبانی مرورگر
                می‌تواند آفلاین نیز اجرا شود.
              </p>
            </div>
            <a className="button primary" href={siteConfig.appUrl}>
              شروع شمارش رایگان
              <span aria-hidden="true">←</span>
            </a>
          </article>

          <p className="pricing-note-v31">
            نتیجه هوش مصنوعی کمک‌ابزار است و باید توسط کاربر بررسی شود. برای
            نکات استفاده ایمن، <Link href="/fa/safety/">راهنمای ایمنی</Link> را
            بخوانید.
          </p>
        </div>
      </section>
    </main>
  )
}
