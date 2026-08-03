import type { Metadata } from 'next'
import Link from 'next/link'
import { CampaignShare } from '@/src/components/CampaignShare'
import { JsonLd } from '@/src/components/JsonLd'
import { breadcrumbJsonLd, campaignJsonLd } from '@/src/lib/seo'
import { siteConfig } from '@/src/lib/site'

export const metadata: Metadata = {
  title: 'پویش هم‌اندازه نیاز | کاهش داروی اضافه و بسته‌بندی غیرضروری',
  description:
    'پویش هم‌اندازه نیاز برای کاهش داروی بلااستفاده و بسته‌بندی غیرضروری؛ با حفظ ایمنی، کیفیت، اصالت و نسخه پزشک.',
  keywords: [
    'داروی اضافه',
    'پسماند دارویی',
    'بسته بندی دارو',
    'مصرف منطقی دارو',
    'دارو به اندازه نیاز',
    'محیط زیست و دارو',
  ],
  alternates: {
    canonical: '/campaign',
  },
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    url: `${siteConfig.url}/campaign`,
    title: 'دارو به اندازه نیاز؛ بسته‌بندی به اندازه ضرورت',
    description:
      'یک مطالبه عمومی برای کاهش داروی بلااستفاده و بسته‌بندی غیرضروری، بدون کاهش ایمنی و کیفیت درمان.',
    images: [
      {
        url: '/images/og-default.png',
        width: 1200,
        height: 630,
        alt: 'پویش هم‌اندازه نیاز از قرص شمار',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'پویش هم‌اندازه نیاز',
    description: 'دارو به اندازه نیاز؛ بسته‌بندی به اندازه ضرورت.',
    images: ['/images/og-default.png'],
  },
}

const campaignPrinciples = [
  {
    number: '۰۱',
    title: 'نسخه و ایمنی خط قرمز است',
    description:
      'هدف پویش کم‌کردن خودسرانه دارو نیست. مقدار، دوز و مدت درمان فقط باید مطابق نظر پزشک و داروساز باشد.',
  },
  {
    number: '۰۲',
    title: 'اندازه بسته باید انعطاف‌پذیرتر شود',
    description:
      'هرجا مقررات و استانداردها اجازه می‌دهند، مقدار تحویلی و بسته‌بندی باید به نسخه و نیاز واقعی بیمار نزدیک‌تر باشد.',
  },
  {
    number: '۰۳',
    title: 'بازگشت امن باید آسان باشد',
    description:
      'داروی بلااستفاده نباید در خانه انباشته یا خودسرانه دور ریخته شود؛ مسیرهای رسمی جمع‌آوری باید در دسترس باشند.',
  },
  {
    number: '۰۴',
    title: 'پایداری بدون قربانی‌کردن کیفیت',
    description:
      'کاهش ماده، بهبود بازیافت‌پذیری و حذف لایه‌های غیرضروری باید همراه با حفظ پایداری، اصالت و رهگیری دارو باشد.',
  },
]

const audiences = [
  {
    label: 'مردم',
    title: 'دارو را به دیگری ندهیم',
    description:
      'داروی نسخه‌ای شخص دیگری را مصرف نکنیم، تاریخ و شرایط نگهداری را بررسی کنیم و برای دفع از مسیر رسمی راهنمایی بگیریم.',
  },
  {
    label: 'داروخانه‌ها',
    title: 'مقدار و آموزش را شفاف کنیم',
    description:
      'مقدار تحویلی، روش مصرف و راه بازگشت داروی بلااستفاده را روشن توضیح دهیم و از شمارش دقیق و مستندسازی کمک بگیریم.',
  },
  {
    label: 'پزشکان و نظام سلامت',
    title: 'نسخه متناسب را تقویت کنیم',
    description:
      'تجویز منطقی یعنی داروی مناسب، برای بیمار مناسب، با دوز و مدت مناسب؛ نه درمان کمتر و نه تجویز بیشتر از نیاز.',
  },
  {
    label: 'صنعت و سیاست‌گذار',
    title: 'گزینه‌های بسته‌بندی بهتر بسازیم',
    description:
      'اندازه‌های متنوع، داده شفاف درباره پسماند، مواد کم‌اثرتر و سامانه بازگشت قابل‌اعتماد را به بخشی از طراحی تبدیل کنیم.',
  },
]

const boundaries = [
  'قطع، کم‌کردن یا تغییر خودسرانه دارو',
  'بازکردن بسته یا تقسیم دارو خارج از فرآیند استاندارد',
  'اهدای مستقیم داروی نسخه‌ای به افراد دیگر',
  'حذف اطلاعات اصالت، تاریخ، شرایط نگهداری یا هشدارهای ایمنی',
]

const sources = [
  {
    name: 'سازمان جهانی بهداشت؛ مدیریت ایمن پسماند دارویی',
    url: 'https://www.who.int/publications/i/item/9789240106710',
  },
  {
    name: 'سازمان جهانی بهداشت؛ حرکت به‌سوی تولید و بسته‌بندی سبزتر',
    url: 'https://www.who.int/news/item/23-12-2024-who-calls-for-transformative-action-towards-a-greener-future-in-pharmaceutical-manufacturing-and-distribution',
  },
  {
    name: 'Health Canada؛ تحویل داروهای بلااستفاده و منقضی',
    url: 'https://www.canada.ca/en/health-canada/services/safe-disposal-prescription-drugs.html',
  },
  {
    name: 'FDA؛ روش‌های امن دفع داروهای بلااستفاده',
    url: 'https://www.fda.gov/consumers/consumer-updates/where-and-how-dispose-unused-medicines',
  },
]

export default function CampaignPage() {
  const breadcrumb = breadcrumbJsonLd([
    {
      name: 'صفحه اصلی',
      url: siteConfig.url,
    },
    {
      name: 'پویش هم‌اندازه نیاز',
      url: `${siteConfig.url}/campaign`,
    },
  ])

  return (
    <main id="main" className="campaign-page-v4">
      {/* BESHMARAI_HAMANDAZEH_CAMPAIGN_V4_0 */}
      <JsonLd data={campaignJsonLd()} />
      <JsonLd data={breadcrumb} />

      <section className="campaign-hero-v4">
        <div className="campaign-noise-v4" aria-hidden="true" />
        <div className="campaign-marquee-v4" aria-hidden="true">
          <span>سلامت بهتر</span>
          <i>•</i>
          <span>پسماند کمتر</span>
          <i>•</i>
          <span>هزینه منطقی‌تر</span>
          <i>•</i>
          <span>دسترسی عادلانه‌تر</span>
        </div>

        <div className="container campaign-hero-grid-v4">
          <div className="campaign-hero-copy-v4">
            <span className="campaign-kicker-v4">پویش عمومی قرص شمار</span>
            <h1>
              دارو به اندازه نیاز؛
              <span>
                بسته‌بندی به اندازه
                <br className="mobile-title-break-v42" />
                {' '}ضرورت.
              </span>
            </h1>
            <p>
              یک مطالبه عمومی برای کاهش داروی بلااستفاده، بسته‌بندی غیرضروری و
              هزینه‌های پنهان؛ بدون دست‌زدن به ایمنی، کیفیت، اصالت یا نسخه پزشک.
            </p>

            <div className="campaign-hero-actions-v4">
              <a className="button campaign-primary-v4" href="#manifesto">
                من هم همراه‌ام
                <span aria-hidden="true">↓</span>
              </a>
              <a className="button campaign-secondary-v4" href="#facts">
                مسئله را ببین
              </a>
            </div>

            <div className="campaign-hashtag-v4">
              <span>#هم_اندازه_نیاز</span>
              <small>برای انتشار در شبکه‌های اجتماعی</small>
            </div>
          </div>

          <div className="campaign-hero-art-v4" aria-label="نمای مفهومی دارو و بسته‌بندی متناسب با نیاز">
            <div className="campaign-sun-v4" aria-hidden="true" />
            <div className="campaign-bottle-v4" aria-hidden="true">
              <span className="campaign-bottle-cap-v4" />
              <span className="campaign-bottle-label-v4">نیاز</span>
              <i className="campaign-pill-v4 campaign-pill-a-v4" />
              <i className="campaign-pill-v4 campaign-pill-b-v4" />
              <i className="campaign-pill-v4 campaign-pill-c-v4" />
            </div>
            <div className="campaign-blister-v4" aria-hidden="true">
              {Array.from({ length: 10 }).map((_, index) => (
                <i key={index} className={index > 5 ? 'empty' : ''} />
              ))}
            </div>
            <div className="campaign-seal-v4" aria-hidden="true">
              <strong>کمتر هدر بدهیم</strong>
              <span>بهتر درمان کنیم</span>
            </div>
          </div>
        </div>
      </section>

      <section className="campaign-signal-v4" aria-label="چهار محور پویش">
        <div className="container campaign-signal-grid-v4">
          <span>سلامت</span>
          <span>محیط زیست</span>
          <span>هزینه</span>
          <span>دسترسی</span>
        </div>
      </section>

      <section className="campaign-section-v4" id="facts">
        <div className="container">
          <div className="campaign-heading-v4">
            <span>مسئله فقط یک جعبه نیست</span>
            <h2>وقتی مقدار مصرف، اندازه بسته و مسیر بازگشت با هم هماهنگ نیستند</h2>
            <p>
              داروی بلااستفاده می‌تواند در خانه بماند، منقضی شود یا به روش نامناسب
              دفع شود. هم‌زمان بسته‌بندی دارویی باید از محصول محافظت کند؛ بنابراین
              راه‌حل، حذف ساده بسته‌بندی نیست، بلکه طراحی و تحویل هوشمندتر است.
            </p>
          </div>

          <div className="campaign-problem-grid-v4">
            <article className="campaign-problem-main-v4">
              <span>داروی اضافه</span>
              <h3>خانه نباید به انبار داروی فراموش‌شده تبدیل شود</h3>
              <p>
                تغییر درمان، اندازه نامتناسب بسته، خرید تکراری و نبود مسیر بازگشت
                روشن می‌تواند داروی بلااستفاده ایجاد کند. این داروها برای مصرف
                خودسرانه یا انتقال به دیگران مناسب نیستند.
              </p>
            </article>
            <article>
              <span>بسته‌بندی</span>
              <h3>ایمنی لازم است؛ اضافه‌کاری نه</h3>
              <p>
                بسته‌بندی باید از رطوبت، نور، آلودگی و دست‌کاری محافظت کند. مطالبه
                ما کاهش اجزای غیرضروری و توسعه گزینه‌های متناسب‌تر است، نه حذف
                حفاظت‌های حیاتی.
              </p>
            </article>
            <article>
              <span>هزینه پنهان</span>
              <h3>چیزی که مصرف نمی‌شود، رایگان نیست</h3>
              <p>
                تولید، حمل، نگهداری، شمارش، جمع‌آوری و امحای داروی بلااستفاده برای
                خانواده، داروخانه، صنعت و نظام سلامت هزینه ایجاد می‌کند.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="campaign-section-v4 campaign-principles-v4">
        <div className="container">
          <div className="campaign-heading-v4 campaign-heading-light-v4">
            <span>چهار اصل غیرقابل مذاکره</span>
            <h2>پایداری وقتی ارزش دارد که درمان را ایمن‌تر و منطقی‌تر کند</h2>
          </div>

          <div className="campaign-principles-grid-v4">
            {campaignPrinciples.map((principle) => (
              <article key={principle.number}>
                <span>{principle.number}</span>
                <h3>{principle.title}</h3>
                <p>{principle.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="campaign-section-v4">
        <div className="container">
          <div className="campaign-heading-v4">
            <span>این تغییر یک کار تیمی است</span>
            <h2>برای هر گروه، یک اقدام روشن</h2>
          </div>

          <div className="campaign-audience-grid-v4">
            {audiences.map((audience) => (
              <article key={audience.label}>
                <span>{audience.label}</span>
                <h3>{audience.title}</h3>
                <p>{audience.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="campaign-section-v4 campaign-boundary-v4">
        <div className="container campaign-boundary-grid-v4">
          <div>
            <span className="campaign-kicker-v4">مرز ایمنی</span>
            <h2>این پویش درباره «کم‌درمانی» نیست</h2>
            <p>
              مصرف منطقی دارو یعنی درمان مناسب و کامل با کمترین اتلاف؛ نه قطع
              خودسرانه، نه اشتراک دارو و نه حذف حفاظت‌های بسته‌بندی.
            </p>
          </div>
          <ul>
            {boundaries.map((boundary) => (
              <li key={boundary}>
                <span aria-hidden="true">×</span>
                {boundary}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="campaign-section-v4" id="manifesto">
        <div className="container campaign-manifesto-v4">
          <div className="campaign-manifesto-copy-v4">
            <span>بیانیه کوتاه پویش</span>
            <h2>من از «هم‌اندازه نیاز» حمایت می‌کنم</h2>
            <p>
              من خواهان نظامی هستم که دارو را مطابق نسخه و نیاز واقعی تحویل دهد،
              بسته‌بندی را تا حد ممکن کم‌اثر و متناسب طراحی کند، مسیر بازگشت امن
              داروی بلااستفاده را فراهم کند و در تمام این مراحل، ایمنی و کیفیت
              درمان را در اولویت نگه دارد.
            </p>
            <CampaignShare />
          </div>
          <div className="campaign-manifesto-poster-v4" aria-hidden="true">
            <small>THE RIGHT AMOUNT</small>
            <strong>هم‌اندازه<br />نیاز</strong>
            <span>دارو کمتر نه؛ اتلاف کمتر.</span>
          </div>
        </div>
      </section>

      <section className="campaign-section-v4 campaign-reading-v4">
        <div className="container">
          <div className="campaign-heading-v4 campaign-heading-light-v4">
            <span>برای مطالعه و انتشار</span>
            <h2>از شعار عبور کنیم؛ مسئله را دقیق بشناسیم</h2>
          </div>

          <div className="campaign-reading-grid-v4">
            <Link href="/blog/unused-medicine-at-home-guide">
              <span>راهنمای خانواده</span>
              <h3>داروی اضافه در خانه؛ چه کنیم و چه کارهایی نکنیم؟</h3>
              <small>مطالعه مقاله ←</small>
            </Link>
            <Link href="/blog/medicine-packaging-environment-guide">
              <span>بسته‌بندی پایدار</span>
              <h3>بسته‌بندی دارو و محیط زیست؛ چرا مسئله پیچیده‌تر از پلاستیک است؟</h3>
              <small>مطالعه مقاله ←</small>
            </Link>
            <Link href="/blog/right-size-prescription-medicine">
              <span>مصرف منطقی</span>
              <h3>دارو به اندازه نیاز یعنی چه و چرا با کم‌درمانی فرق دارد؟</h3>
              <small>مطالعه مقاله ←</small>
            </Link>
            <Link href="/blog/safe-unused-medicine-return">
              <span>بازگشت امن</span>
              <h3>داروی بلااستفاده را کجا تحویل بدهیم؟ راهنمای تصمیم‌گیری امن</h3>
              <small>مطالعه مقاله ←</small>
            </Link>
          </div>
        </div>
      </section>

      <section className="campaign-section-v4 campaign-sources-v4">
        <div className="container campaign-sources-grid-v4">
          <div>
            <span className="campaign-kicker-v4">منابع و شفافیت</span>
            <h2>پویش بر پایه مطالبه مسئولانه است، نه ادعای اغراق‌آمیز</h2>
            <p>
              منابع زیر جهت‌گیری جهانی درباره پسماند دارویی، بسته‌بندی پایدار و
              بازگشت دارو را توضیح می‌دهند. روش دفع و بازگشت در هر کشور متفاوت
              است؛ دستور رسمی محل زندگی خود را رعایت کنید.
            </p>
          </div>
          <div className="campaign-source-list-v4">
            {sources.map((source) => (
              <a href={source.url} key={source.url} target="_blank" rel="noopener noreferrer">
                <span>{source.name}</span>
                <i aria-hidden="true">↗</i>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="campaign-final-v4">
        <div className="container campaign-final-card-v4">
          <span>#هم_اندازه_نیاز</span>
          <h2>یک جمله می‌تواند شروع یک گفت‌وگوی ملی باشد</h2>
          <p>
            این صفحه را برای خانواده، داروساز، پزشک، رسانه یا تصمیم‌گیری که باید
            این گفت‌وگو را ببیند بفرستید.
          </p>
          <CampaignShare />
        </div>
      </section>
    </main>
  )
}
