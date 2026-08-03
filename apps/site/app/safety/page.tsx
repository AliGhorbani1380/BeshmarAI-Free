import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'راهنمای ایمنی استفاده',
  description: 'شرایط تصویر و تأیید انسانی برای نتیجه قابل‌اعتماد ضروری‌اند.',
  alternates: {
    canonical: '/safety',
  },
}

export default function Page() {
  return (
    <main id="main">
      <section className="page-hero">
        <div className="container narrow">
          <span className="badge"><i /> قرص شمار</span>
          <h1>راهنمای ایمنی استفاده</h1>
          <p>شرایط تصویر و تأیید انسانی برای نتیجه قابل‌اعتماد ضروری‌اند.</p>
        </div>
      </section>

      <section className="section">
        <article className="container narrow prose-card">
          <section>
            <h2>نور مناسب</h2>
            <p>از نور یکنواخت استفاده کنید و بازتاب شدید روی قرص‌ها را کاهش دهید.</p>
          </section>
          <section>
            <h2>تصویر واضح</h2>
            <p>دوربین را ثابت نگه دارید و در صورت تاری، شمارش را تکرار کنید.</p>
          </section>
          <section>
            <h2>پس‌زمینه</h2>
            <p>سطح یکنواخت و دارای تضاد کافی با رنگ قرص انتخاب کنید.</p>
          </section>
          <section>
            <h2>تأیید نهایی</h2>
            <p>عدد و کادرهای تشخیص را بررسی کنید. ابزار جایگزین بررسی انسانی نیست.</p>
          </section>
        </article>
      </section>
    </main>
  )
}
