import Image from 'next/image'
import Link from 'next/link'
import { siteConfig } from '@/src/lib/site'

export function Footer() {
  const year = new Date().getFullYear().toLocaleString('fa-IR')

  return (
    <footer className="footer">
      <div className="container footer-top-v3">
        <div className="footer-brand-column-v3">
          <Link
            className="brand footer-brand"
            href="/"
            aria-label="صفحه اصلی قرص شمار | BeshmarAI"
          >
            <Image
              className="brand-logo-image footer-brand-logo-image"
              src="/brand/site/logo-full.png"
              alt="قرص شمار | BeshmarAI"
              width={895}
              height={188}
              sizes="(max-width: 650px) 260px, 300px"
            />
          </Link>
          <p>
            راهکار هوشمند شمارش قرص برای تکنسین‌ها و داروخانه‌هایی که
            سرعت، نظم و تجربه حرفه‌ای می‌خواهند.
          </p>
          <a className="footer-app-link-v3" href={siteConfig.appUrl}>
            ورود به قرص شمار
            <span aria-hidden="true">←</span>
          </a>
        </div>

        <div className="footer-links-v3">
          <strong>محصول</strong>
          <Link href="/#how-it-works">نحوه کار</Link>
          <Link href="/#features">امکانات</Link>
          <Link href="/pricing">نسخه رایگان</Link>
          <Link className="footer-campaign-link-v4" href="/campaign">
            پویش هم‌اندازه نیاز
          </Link>
          <a href={siteConfig.appUrl}>شروع شمارش</a>
        </div>

        <div className="footer-links-v3">
          <strong>محتوا</strong>
          <Link href="/blog">مجله قرص شمار</Link>
          <Link href="/category/pill-counting">شمارش قرص</Link>
          <Link href="/category/pharmacy-technician">آموزش تکنسین</Link>
          <Link href="/category/responsible-medicine-use">مصرف مسئولانه دارو</Link>
        </div>

        <div className="footer-links-v3">
          <strong>پشتیبانی و قوانین</strong>
          <Link href="/support">پشتیبانی</Link>
          <Link href="/safety">راهنمای ایمنی</Link>
          <Link href="/privacy">حریم خصوصی</Link>
          <Link href="/terms">قوانین استفاده</Link>
        </div>
      </div>

      <div className="container copyright">
        <span>© {year} قرص شمار | BeshmarAI؛ تمامی حقوق محفوظ است.</span>
        <a href={`mailto:${siteConfig.supportEmail}`}>
          {siteConfig.supportEmail}
        </a>
      </div>
    </footer>
  )
}
