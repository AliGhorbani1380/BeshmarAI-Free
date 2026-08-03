import Link from 'next/link'

export default function NotFound() {
  return (
    <main id="main" className="not-found">
      <div className="container narrow">
        <span className="badge"><i /> ۴۰۴</span>
        <h1>صفحه موردنظر پیدا نشد</h1>
        <p>ممکن است آدرس تغییر کرده باشد یا مقاله هنوز منتشر نشده باشد.</p>
        <Link className="button primary" href="/">
          بازگشت به صفحه اصلی
        </Link>
      </div>
    </main>
  )
}
