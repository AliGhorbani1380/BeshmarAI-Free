import type { Metadata } from 'next'
import { siteConfig } from '@/src/lib/site'

export const metadata: Metadata = {
  title: 'درباره قرص شمار',
  description:
    'معرفی نسخه عمومی و رایگان قرص شمار؛ شمارش قرص با هوش مصنوعی روی دستگاه کاربر.',
  alternates: {
    canonical: '/about/',
  },
}

export default function AboutPage() {
  return (
    <main id="main">
      <section className="page-hero">
        <div className="container narrow">
          <span className="badge"><i /> درباره محصول</span>
          <h1>هوش مصنوعی برای ساده‌ترکردن شمارش‌های تکراری</h1>
          <p>
            {siteConfig.name} یک کمک‌ابزار شمارش تصویری است که برای موبایل
            و مرورگر طراحی شده است.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container narrow article-content">
          <h2>نسخه عمومی چگونه کار می‌کند؟</h2>
          <p>
            برنامه و مدل‌های شمارش به مرورگر تحویل داده می‌شوند و اجرای
            مدل روی همان دستگاه انجام می‌شود. تصویر شمارش برای inference
            به سرور ارسال نمی‌شود.
          </p>

          <h2>چه اطلاعاتی لازم است؟</h2>
          <p>
            برای استفاده از نسخه عمومی به حساب کاربری، شماره موبایل، OTP،
            پرداخت یا اشتراک نیاز نیست.
          </p>

          <h2>محدودیت مهم</h2>
          <p>
            خروجی مدل قطعی نیست و جایگزین شمارش و تأیید انسانی، داروساز،
            مسئول فنی یا رویه‌های قانونی داروخانه نمی‌شود.
          </p>

          <h2>کد عمومی</h2>
          <p>
            سورس نسخه رایگان جدا از سامانه خصوصی منتشر می‌شود و شامل
            backend، پایگاه داده، پنل مدیریت یا credential خصوصی نیست.
          </p>
        </div>
      </section>
    </main>
  )
}
