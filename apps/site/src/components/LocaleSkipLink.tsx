'use client'

import { usePathname } from 'next/navigation'

export function LocaleSkipLink() {
  const pathname = usePathname()
  const isPersian = pathname === '/fa' || pathname.startsWith('/fa/')

  return (
    <a className="skip-link" href="#main">
      {isPersian ? 'پرش به محتوای اصلی' : 'Skip to main content'}
    </a>
  )
}
