import type { Metadata } from 'next'
import { siteConfig } from '@/src/lib/site'

export const metadata: Metadata = {
  title: 'پشتیبانی',
  description:
    'راهنمای رفع مشکلات رایج نسخه عمومی قرص شمار و راه ارتباطی.',
  alternates: {
    canonical: '/fa/support/',
  },
}

const items = [
  {
    title: 'دوربین باز نمی‌شود',
    text: 'اجازه دوربین را برای این سایت فعال کنید، صفحه را روی HTTPS باز کنید و مرورگر را به‌روز نگه دارید.',
  },
  {
    title: 'مدل دانلود نمی‌شود',
    text: 'فضای ذخیره‌سازی مرورگر و اتصال پایدار را بررسی کنید. در اولین اجرا مدل دقیق حدود ۸۰ مگابایت است.',
  },
  {
    title: 'شمارش کند است',
    text: 'برنامه موتور مناسب دستگاه را انتخاب می‌کند. بستن برنامه‌های سنگین و خنک نگه‌داشتن گوشی می‌تواند کمک کند.',
  },
  {
    title: 'نتیجه دقیق نیست',
    text: 'نور یکنواخت، سطح دارای کنتراست، لنز تمیز و جدا بودن قرص‌ها را بررسی و نتیجه را دوباره شمارش کنید.',
  },
]

export default function SupportPage() {
  return (
    <main id="main">
      <section className="page-hero">
        <div className="container narrow">
          <span className="badge"><i /> پشتیبانی</span>
          <h1>رفع مشکلات رایج</h1>
          <p>
            نسخه عمومی بدون حساب کاربری کار می‌کند؛ بیشتر مشکلات به مجوز
            دوربین، ذخیره مدل، مرورگر یا شرایط تصویربرداری مربوط‌اند.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container narrow article-content">
          {items.map((item) => (
            <section key={item.title}>
              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </section>
          ))}

          <h2>ارتباط</h2>
          <p>
            توضیح خطا، مدل دستگاه، نام مرورگر و زمان تقریبی رخداد را بدون
            ارسال اطلاعات بیمار یا تصویر محرمانه به{' '}
            <a href={`mailto:${siteConfig.supportEmail}`}>
              {siteConfig.supportEmail}
            </a>{' '}
            بفرستید.
          </p>
        </div>
      </section>
    </main>
  )
}
