import type { Metadata } from 'next'
import Link from 'next/link'
import { siteConfig } from '@/src/lib/site'

export const metadata: Metadata = {
  title: 'درباره قرص شمار و راه‌های ارتباطی',
  description:
    'معرفی نسخه عمومی قرص شمار، سازنده پروژه و راه‌های تماس برای پشتیبانی محصول.',
  alternates: {
    canonical: '/fa/about/',
    languages: { en: '/about/', fa: '/fa/about/' },
  },
}

export default function AboutPage() {
  return (
    <main id="main">
      <section className="page-hero">
        <div className="container narrow">
          <span className="badge"><i /> درباره قرص شمار</span>
          <h1>شمارش خصوصی و قابل بررسی با هوش مصنوعی روی دستگاه</h1>
          <p>
            {siteConfig.name} با ترکیب بینایی ماشین، رابط موبایل‌محور و اجرای
            محلی مدل، شمارش‌های تکراری را سریع‌تر می‌کند و بازبینی انسانی را
            در مرکز فرآیند نگه می‌دارد.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container narrow article-content">
          <h2>قرص شمار چیست؟</h2>
          <p>
            قرص شمار یک کمک‌ابزار شمارش تصویری برای تیم‌های داروخانه، مراقبان،
            پژوهشگران و کاربرانی است که به یک عدد پیشنهادی سریع و قابل بررسی
            نیاز دارند. نسخه عمومی به‌صورت PWA مرورگری ارائه می‌شود و برای
            استفاده به حساب، شماره موبایل، OTP، پرداخت یا اشتراک نیاز ندارد.
          </p>

          <h2>نسخه عمومی چگونه کار می‌کند؟</h2>
          <p>
            برنامه، فایل‌های ONNX Runtime و قطعه‌های تأییدشده مدل به‌صورت
            استاتیک تحویل مرورگر می‌شوند. inference روی دستگاه کاربر و با
            WebGPU یا مسیر سازگار CPU/WebAssembly انجام می‌شود. تصویر شمارش
            به Endpoint پردازش تصویر در سرور ارسال نمی‌شود.
          </p>

          <h2>چرا بازبینی نتیجه ضروری است؟</h2>
          <p>
            برنامه عدد پیشنهادی را همراه نشانه‌های تشخیص نمایش می‌دهد تا کاربر
            بتواند موارد شمرده‌شده را بررسی کند. هم‌پوشانی، بازتاب نور، تاری،
            کادربندی، کیفیت دوربین، رفتار مرورگر و توان دستگاه می‌توانند روی
            نتیجه اثر بگذارند؛ بنابراین تأیید انسانی مسئولانه الزامی است.
          </p>

          <h2>سازنده و نگهدارنده پروژه</h2>
          <p>
            BeshmarAI و این نسخه عمومی توسط{' '}
            <strong>{siteConfig.creatorNameFa}</strong> ساخته و نگهداری می‌شوند.
            پشتیبانی محصول، مستندات عمومی، سازگاری Runtime و نسخه GitHub Pages
            از طریق راه‌های ارتباطی زیر پیگیری می‌شوند.
          </p>

          <div className="support-grid-v31" aria-label="راه‌های ارتباطی قرص شمار">
            <article className="support-card-v31">
              <span aria-hidden="true">۰۱</span>
              <h2>سازنده و نگهدارنده</h2>
              <p>
                <strong>{siteConfig.creatorNameFa}</strong><br />
                توسعه محصول و نگهداری نسخه عمومی
              </p>
            </article>

            <article className="support-card-v31">
              <span aria-hidden="true">۰۲</span>
              <h2>تلفن پشتیبانی</h2>
              <p>
                <a href={siteConfig.supportPhoneHref} dir="ltr">
                  {siteConfig.supportPhoneDisplay}
                </a><br />
                برای پشتیبانی محصول و مشکلات فنی
              </p>
            </article>

            <article className="support-card-v31">
              <span aria-hidden="true">۰۳</span>
              <h2>ایمیل پشتیبانی</h2>
              <p>
                <a href={`mailto:${siteConfig.supportEmail}`} dir="ltr">
                  {siteConfig.supportEmail}
                </a><br />
                مدل دستگاه، مرورگر و متن دقیق خطا را ارسال کنید
              </p>
            </article>
          </div>

          <h2>پروفایل‌ها و لینک‌های پروژه</h2>
          <p>
            پروفایل{' '}
            <a href={siteConfig.githubProfileUrl} target="_blank" rel="noreferrer">
              GitHub سازنده
            </a>
            ،{' '}
            <a href={siteConfig.linkedinUrl} target="_blank" rel="noreferrer">
              پروفایل LinkedIn
            </a>
            ،{' '}
            <a href={siteConfig.githubUrl} target="_blank" rel="noreferrer">
              مخزن عمومی BeshmarAI-Free
            </a>{' '}
            و{' '}
            <a href={siteConfig.appUrl}>برنامه شمارش قرص</a>{' '}
            در دسترس هستند.
          </p>

          <h2>مرز نسخه عمومی و سامانه خصوصی</h2>
          <p>
            سورس عمومی عمداً از سامانه خصوصی جدا شده است و شامل Backend،
            پایگاه داده، ورود شماره موبایل، OTP، پرداخت، اشتراک، پنل‌های
            مدیریت، Credentialهای پروداکشن، Telemetry خصوصی و تاریخچه Git
            مخزن خصوصی نیست.
          </p>

          <h2>ایمنی پیش از استفاده عملیاتی</h2>
          <p>
            قرص شمار دارو را شناسایی نمی‌کند، نسخه نمی‌نویسد، دوز را تأیید
            نمی‌کند و جایگزین رویه‌های قانونی و حرفه‌ای نیست. پیش از استفاده،
            <Link href="/fa/safety"> راهنمای ایمنی </Link>
            را بخوانید و هر نتیجه را بازبینی کنید.
          </p>
        </div>
      </section>
    </main>
  )
}
