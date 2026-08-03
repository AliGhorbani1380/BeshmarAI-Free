import Image from 'next/image'
import Link from 'next/link'
import { ArticleCard } from '@/src/components/ArticleCard'
import { JsonLd } from '@/src/components/JsonLd'
import { getArticles } from '@/src/lib/content'
import { siteConfig } from '@/src/lib/site'

const steps = [
  {
    number: '۰۱',
    title: 'قرص‌ها را آماده کنید',
    description:
      'قرص‌ها را روی سطح مناسب پخش کنید و محدوده شمارش را داخل دوربین قرار دهید.',
  },
  {
    number: '۰۲',
    title: 'هوش مصنوعی می‌شمارد',
    description:
      'قرص شمار تصویر را تحلیل می‌کند و نتیجه پیشنهادی را در چند لحظه نمایش می‌دهد.',
  },
  {
    number: '۰۳',
    title: 'نتیجه را بررسی کنید',
    description:
      'عدد و نشانه‌های تشخیص را ببینید، نتیجه را تأیید کنید یا شمارش را تکرار کنید.',
  },
]

const aiBenefits = [
  'شمارش سریع‌تر در کارهای تکراری روزانه',
  'نمایش واضح نتیجه برای بررسی تکنسین',
  'رابط ساده و قابل استفاده با دوربین موبایل',
  'طراحی‌شده برای جریان کاری واقعی داروخانه',
]

const faqItems = [
  {
    question: 'آیا تصویر قرص به سرور ارسال می‌شود؟',
    answer:
      'خیر. پردازش شمارش روی همان دستگاه شما انجام می‌شود و تصویر برای اجرای مدل به سرور ارسال نمی‌شود.',
  },
  {
    question: 'نسخه رایگان قرص شمار چگونه فعال می‌شود؟',
    answer:
      'نسخه عمومی بدون ورود و بدون محدودیت زمانی در دسترس است.',
  },
  {
    question: 'آیا بدون اینترنت هم می‌توان شمارش کرد؟',
    answer:
      'پس از بارگذاری اولیه برنامه و مدل‌ها، بخش‌های ذخیره‌شده می‌توانند بدون اینترنت نیز اجرا شوند.',
  },
  {
    question: 'آیا برای استفاده باید وارد حساب شوم؟',
    answer:
      'خیر. نسخه عمومی بدون شماره موبایل، OTP و حساب کاربری اجرا می‌شود.',
  },
  {
    question: 'آیا نسخه عمومی رایگان است؟',
    answer:
      'بله. نسخه عمومی روی وب بدون پرداخت و بدون اشتراک در دسترس است.',
  },
  {
    question: 'آیا نتیجه هوش مصنوعی جایگزین بررسی تکنسین است؟',
    answer:
      'خیر. نتیجه پیشنهادی باید توسط کاربر بررسی و در صورت نیاز شمارش تکرار شود.',
  },
]

const softwareApplicationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: siteConfig.name,
  alternateName: siteConfig.englishName,
  description: siteConfig.descriptionFa,
  url: siteConfig.appUrl,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Android, iOS Web App, Web',
  inLanguage: 'fa-IR',
  featureList: [
    'شمارش قرص با دوربین موبایل',
    'تحلیل تصویر با هوش مصنوعی',
    'نمایش نتیجه پیشنهادی برای بررسی کاربر',
    'اپلیکیشن Android و Web App برای iPhone',
  ],
}

export default async function HomePage() {
  const articles = (await getArticles('fa')).slice(0, 3)
  const featuredArticle = articles[0]
  const compactArticles = articles.slice(1)

  return (
    <main id="main">
      {/* BESHMARAI_HOME_REDESIGN_V3_1 */}
      <JsonLd data={softwareApplicationJsonLd} />

      <section className="hero-v3">
        <div className="hero-grid-pattern-v3" aria-hidden="true" />
        <div className="container hero-grid-v3">
          <div className="hero-copy-v3">
            <span className="eyebrow-v3">
              <span className="eyebrow-dot-v3" />
              دستیار هوشمند تکنسین داروخانه
            </span>

            <h1>
              شمارش قرص با
              <br className="mobile-title-break-v42" />
              {' '}هوش مصنوعی؛
              <span>سریع‌تر، ساده‌تر، حرفه‌ای‌تر</span>
            </h1>

            <p className="hero-lead-v3">
              دوربین موبایل را روی قرص‌ها بگیرید و نتیجه شمارش را در چند
              لحظه ببینید. قرص شمار برای تکنسین‌هایی ساخته شده که به سرعت،
              نظم و کنترل بیشتر در کار روزانه نیاز دارند.
            </p>

            <div className="hero-actions-v3">
              <a className="button primary button-glow-v3" href={siteConfig.appUrl}>
                شروع شمارش رایگان
                <span aria-hidden="true">←</span>
              </a>
              <a className="button secondary" href="#how-it-works">
                نحوه کار قرص شمار
              </a>
            </div>

            <div className="hero-trust-v3" aria-label="ویژگی‌های قابل استفاده قرص شمار">
              <span>اپلیکیشن Android</span>
              <span>Web App برای iPhone</span>
              <span>رایگان و بدون ورود</span>
              <span>نتیجه قابل بررسی</span>
            </div>
          </div>

          <div className="hero-visual-v3" aria-label="نمای نمونه شمارش قرص با قرص شمار">
            <div className="hero-orbit-v3" aria-hidden="true" />
            <div className="hero-image-v3">
              <Image
                src="/images/hero-visual-v23.png"
                alt="تکنسین داروخانه در حال شمارش قرص با دوربین موبایل و هوش مصنوعی قرص شمار"
                fill
                priority
                sizes="(max-width: 940px) 100vw, 48vw"
              />
              <div className="scan-beam-v3" aria-hidden="true" />
              <span className="detection-point-v3 point-one-v3" aria-hidden="true" />
              <span className="detection-point-v3 point-two-v3" aria-hidden="true" />
              <span className="detection-point-v3 point-three-v3" aria-hidden="true" />
            </div>

            <div className="vision-status-v3">
              <span className="live-dot-v3" />
              <div>
                <small>تحلیل هوشمند</small>
                <strong>نتیجه آماده بررسی است</strong>
              </div>
            </div>

            <div className="result-card-v3">
              <div>
                <small>نمایش نمونه</small>
                <strong>۴۸</strong>
                <span>قرص شناسایی‌شده</span>
              </div>
              <div className="result-pills-v3" aria-hidden="true">
                {Array.from({ length: 9 }).map((_, index) => (
                  <i key={index} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="facts-bar-v3" aria-label="مشخصات اصلی محصول">
        <div className="container facts-grid-v3">
          <div>
            <strong>روی دستگاه</strong>
            <span>بدون ارسال تصویر شمارش</span>
          </div>
          <div>
            <strong>روی دستگاه</strong>
            <span>بدون ارسال تصویر</span>
          </div>
          <div>
            <strong>رایگان</strong>
            <span>بدون حساب و پرداخت</span>
          </div>
          <div>
            <strong>Android + iPhone</strong>
            <span>اپلیکیشن و Web App</span>
          </div>
        </div>
      </section>

      <section className="section-v3 steps-section-v3" id="how-it-works">
        <div className="container">
          <div className="section-heading-v3 centered-v3">
            <span className="kicker-v3">ساده از اولین شمارش</span>
            <h2>سه قدم تا یک نتیجه واضح و قابل بررسی</h2>
            <p>
              قرص شمار فرایند را کوتاه نگه می‌دارد تا تمرکز شما روی کار
              داروخانه باقی بماند.
            </p>
          </div>

          <div className="steps-grid-v3">
            {steps.map((step) => (
              <article className="step-card-v3" key={step.number}>
                <span className="step-number-v3">{step.number}</span>
                <div className="step-icon-v3" aria-hidden="true">
                  <span />
                </div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-v3 ai-showcase-v3" id="features">
        <div className="container ai-showcase-grid-v3">
          <div className="ai-showcase-copy-v3">
            <span className="kicker-v3">هوش مصنوعی برای کار واقعی</span>
            <h2>از تصویر دوربین تا یک نتیجه واضح و قابل بررسی</h2>
            <p>
              قرص شمار با تمرکز بر شمارش قرص ساخته شده است؛ یک تجربه سریع،
              روشن و حرفه‌ای که تکنسین می‌تواند نتیجه آن را ببیند و بررسی کند.
            </p>

            <ul className="benefit-list-v3">
              {aiBenefits.map((benefit) => (
                <li key={benefit}>
                  <span aria-hidden="true">✓</span>
                  {benefit}
                </li>
              ))}
            </ul>

            <a className="text-link-v3" href={siteConfig.appUrl}>
              تجربه قرص شمار
              <span aria-hidden="true">←</span>
            </a>
          </div>

          <div className="ai-showcase-visual-v3">
            <div className="ai-image-frame-v3">
              <Image
                src="/images/on-device-ai-v23.png"
                alt="نمای مفهومی هوش مصنوعی قرص شمار برای شمارش قرص با موبایل"
                fill
                sizes="(max-width: 940px) 100vw, 46vw"
              />
            </div>
            <div className="ai-signal-v3 signal-one-v3" aria-hidden="true" />
            <div className="ai-signal-v3 signal-two-v3" aria-hidden="true" />
            <div className="ai-mini-card-v3">
              <span>هوش مصنوعی تخصصی</span>
              <strong>آماده برای جریان کاری داروخانه</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="section-v3 trust-section-v31" aria-labelledby="trust-title">
        <div className="container trust-grid-v31">
          <div className="trust-copy-v31">
            <span className="kicker-v3">حریم خصوصی و تداوم کار</span>
            <h2 id="trust-title">تصویر شمارش روی دستگاه می‌ماند</h2>
            <p>
              مدل شمارش روی موبایل یا مرورگر شما اجرا می‌شود. برای inference،
              تصویر قرص به هیچ Backend ارسال نمی‌شود و اجرای مدل،
              ورود و دسترسی به سرور وابسته‌اند.
            </p>
            <div className="trust-points-v31">
              <article>
                <span aria-hidden="true">01</span>
                <div>
                  <strong>پردازش محلی</strong>
                  <p>تصویر شمارش برای اجرای مدل به سرور ارسال نمی‌شود.</p>
                </div>
              </article>
              <article>
                <span aria-hidden="true">02</span>
                <div>
                  <strong>قابل استفاده آفلاین</strong>
                  <p>پس از ذخیره‌شدن فایل‌های برنامه و مدل، اجرای محلی به اینترنت وابسته نیست.</p>
                </div>
              </article>
              <article>
                <span aria-hidden="true">03</span>
                <div>
                  <strong>ورود ماندگار</strong>
                  <p>تا زمان خروج، نیازی به ورود دوباره در هر مراجعه نیست.</p>
                </div>
              </article>
            </div>
          </div>

          <div className="trust-visual-v31" aria-hidden="true">
            <div className="trust-device-v31">
              <span className="trust-device-label-v31">ON-DEVICE AI</span>
              <div className="trust-shield-v31">✓</div>
              <strong>تصویر روی دستگاه</strong>
              <small>حساب و مجوز دسترسی با سرور</small>
            </div>
            <span className="trust-orbit-v31 orbit-a-v31" />
            <span className="trust-orbit-v31 orbit-b-v31" />
          </div>
        </div>
      </section>

      <section className="section-v3 bento-section-v3">
        <div className="container">
          <div className="section-heading-v3 split-heading-v3">
            <div>
              <span className="kicker-v3">طراحی‌شده برای تکنسین‌ها</span>
              <h2>هر چیزی که برای شروع سریع نیاز دارید</h2>
            </div>
            <p>
              بدون مسیر پیچیده؛ وارد شوید، دوربین را آماده کنید و شمارش را
              شروع کنید.
            </p>
          </div>

          <div className="bento-grid-v3">
            <article className="bento-card-v3 bento-main-v3">
              <div className="bento-copy-v3">
                <span className="bento-label-v3">تجربه موبایل‌محور</span>
                <h3>روی Android و iPhone در دسترس شماست</h3>
                <p>
                  اپلیکیشن اختصاصی Android و Web App برای iPhone، تا ابزار
                  شمارش همیشه در دسترس تکنسین باشد.
                </p>
                <div className="platform-tags-v3">
                  <span>Android App</span>
                  <span>iPhone Web App</span>
                </div>
              </div>
              <div className="phone-mock-v3" aria-hidden="true">
                <div className="phone-speaker-v3" />
                <div className="phone-screen-v3">
                  <span className="phone-ai-v3">AI</span>
                  <strong>شمارش آماده است</strong>
                  <div className="phone-count-v3">۴۸</div>
                  <div className="phone-button-v3">بررسی نتیجه</div>
                </div>
              </div>
            </article>

            <article className="bento-card-v3 bento-free-v3">
              <span className="bento-icon-v3" aria-hidden="true">✦</span>
              <strong>رایگان و عمومی</strong>
              <h3>قبل از انتخاب، تجربه‌اش کنید</h3>
              <p>بدون ورود، شماره موبایل، پرداخت یا محدودیت زمانی شروع کنید.</p>
            </article>

            <article className="bento-card-v3 bento-control-v3">
              <span className="bento-icon-v3" aria-hidden="true">◎</span>
              <strong>نتیجه قابل بررسی</strong>
              <h3>کنترل نهایی همچنان با شماست</h3>
              <p>عدد پیشنهادی و وضعیت تشخیص را ببینید و سپس ادامه دهید.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section-v3 pricing-preview-v31" aria-labelledby="pricing-preview-title">
        <div className="container pricing-preview-card-v31">
          <div>
            <span className="kicker-v3">نسخه عمومی قرص شمار</span>
            <h2 id="pricing-preview-title">رایگان، مستقل و بدون نیاز به حساب کاربری</h2>
            <p>
              دوره‌های ماهانه، شش‌ماهه و سالانه برای زمان فعال‌شدن فروش آماده
              شده است و هیچ سفارش، پرداخت یا حسابی ایجاد نمی‌کند.
            </p>
          </div>
          <div className="pricing-preview-actions-v31">
            <Link className="button secondary" href="/fa/pricing">
              مشاهده توضیحات نسخه رایگان
            </Link>
            <a className="button primary" href={siteConfig.appUrl}>
              شروع رایگان
            </a>
          </div>
        </div>
      </section>

      <section className="section-v3 home-campaign-v4" aria-labelledby="home-campaign-title">
        <div className="container home-campaign-card-v4">
          <div className="home-campaign-copy-v4">
            <span className="home-campaign-label-v4">پویش هم‌اندازه نیاز</span>
            <h2 id="home-campaign-title">
              دارو به اندازه نیاز؛
              <span>بسته‌بندی به اندازه ضرورت.</span>
            </h2>
            <p>
              یک گفت‌وگوی عمومی برای کاهش داروی بلااستفاده، بسته‌بندی غیرضروری
              و هزینه‌های پنهان؛ بدون کاهش ایمنی، کیفیت یا درمان کامل.
            </p>
            <div className="home-campaign-actions-v4">
              <Link className="button campaign-primary-v4" href="/fa/campaign">
                ورود به پویش
                <span aria-hidden="true">←</span>
              </Link>
              <Link className="text-link-v3" href="/fa/category/responsible-medicine-use">
                مطالعه مطالب مرتبط
                <span aria-hidden="true">←</span>
              </Link>
            </div>
          </div>
          <div className="home-campaign-poster-v4" aria-hidden="true">
            <small>#هم_اندازه_نیاز</small>
            <strong>کمتر<br />هدر بدهیم</strong>
            <span>بهتر درمان کنیم</span>
          </div>
        </div>
      </section>

      <section className="section-v3 magazine-section-v3">
        <div className="container">
          <div className="section-heading-v3 split-heading-v3">
            <div>
              <span className="kicker-v3">مجله قرص شمار</span>
              <h2>راهنماهای کاربردی برای داروخانه حرفه‌ای</h2>
            </div>
            <Link className="button secondary" href="/fa/blog">
              مشاهده همه مقاله‌ها
            </Link>
          </div>

          <div className="magazine-grid-v3">
            {featuredArticle ? (
              <article className="featured-article-v3">
                <Link
                  className="featured-image-v3"
                  href={`/fa/blog/${featuredArticle.slug}`}
                  aria-label={featuredArticle.title}
                >
                  <Image
                    src={featuredArticle.coverImage}
                    alt={featuredArticle.coverAlt}
                    fill
                    sizes="(max-width: 940px) 100vw, 58vw"
                  />
                  <span className="featured-category-v3">
                    {featuredArticle.category.name}
                  </span>
                </Link>
                <div className="featured-copy-v3">
                  <span>
                    {featuredArticle.readingMinutes.toLocaleString('fa-IR')} دقیقه مطالعه
                  </span>
                  <h3>
                    <Link href={`/fa/blog/${featuredArticle.slug}`}>
                      {featuredArticle.title}
                    </Link>
                  </h3>
                  <p>{featuredArticle.excerpt}</p>
                  <Link className="text-link-v3" href={`/fa/blog/${featuredArticle.slug}`}>
                    مطالعه مقاله
                    <span aria-hidden="true">←</span>
                  </Link>
                </div>
              </article>
            ) : null}

            <div className="magazine-side-v3">
              {compactArticles.map((article) => (
                <ArticleCard locale="fa" article={article} key={article.id} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-v3 faq-section-v31" aria-labelledby="faq-title">
        <div className="container faq-grid-v31">
          <div className="faq-heading-v31">
            <span className="kicker-v3">پرسش‌های پرتکرار</span>
            <h2 id="faq-title">پیش از اولین شمارش چه چیزهایی بدانم؟</h2>
            <p>
              پاسخ‌های کوتاه درباره حریم خصوصی، ورود، استفاده آفلاین و وضعیت
              اشتراک.
            </p>
            <Link className="text-link-v3" href="/fa/support">
              ارتباط با پشتیبانی
              <span aria-hidden="true">←</span>
            </Link>
          </div>

          <div className="faq-list-v31">
            {faqItems.map((item, index) => (
              <details className="faq-item-v31" key={item.question}>
                <summary>
                  <span>{(index + 1).toLocaleString('fa-IR')}</span>
                  {item.question}
                </summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="section-v3 final-cta-section-v3">
        <div className="container final-cta-v3">
          <div className="final-cta-glow-v3" aria-hidden="true" />
          <div>
            <span className="kicker-v3">آماده شروع هستید؟</span>
            <h2>شمارش قرص را با یک تجربه سریع‌تر و حرفه‌ای‌تر شروع کنید</h2>
            <p>
              نسخه رایگان در اختیار شماست تا قرص شمار را در جریان
              کاری واقعی خود امتحان کنید.
            </p>
          </div>
          <a className="button primary button-glow-v3" href={siteConfig.appUrl}>
            شروع شمارش رایگان
            <span aria-hidden="true">←</span>
          </a>
        </div>
      </section>
    </main>
  )
}
