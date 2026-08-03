import Link from 'next/link'

export default function NotFound() {
  return (
    <main id="main" className="not-found locale-en">
      <div className="container narrow">
        <span className="badge"><i /> 404</span>
        <h1>Page not found</h1>
        <p>The address may have changed or the requested content is not available.</p>
        <Link className="button primary" href="/">Return home</Link>
      </div>
    </main>
  )
}
