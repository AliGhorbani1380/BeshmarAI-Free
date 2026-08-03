'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { siteConfig } from '@/src/lib/site'

type NavItem = {
  href: string
  label: string
  match?: string
  campaign?: boolean
}

const englishNavItems: NavItem[] = [
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#features', label: 'Features' },
  { href: '/campaign', label: 'Campaign', match: '/campaign', campaign: true },
  { href: '/pricing', label: 'Free edition', match: '/pricing' },
  { href: '/blog', label: 'Insights', match: '/blog' },
  { href: '/about', label: 'About', match: '/about' },
  { href: '/support', label: 'Support', match: '/support' },
]

const persianNavItems: NavItem[] = [
  { href: '/fa/#how-it-works', label: 'نحوه کار' },
  { href: '/fa/#features', label: 'امکانات' },
  {
    href: '/fa/campaign',
    label: 'پویش',
    match: '/fa/campaign',
    campaign: true,
  },
  {
    href: '/fa/pricing',
    label: 'نسخه رایگان',
    match: '/fa/pricing',
  },
  {
    href: '/fa/blog',
    label: 'مجله',
    match: '/fa/blog',
  },
  {
    href: '/fa/about',
    label: 'درباره ما',
    match: '/fa/about',
  },
  {
    href: '/fa/support',
    label: 'پشتیبانی',
    match: '/fa/support',
  },
]

function switchLanguagePath(
  pathname: string,
  target: 'en' | 'fa',
): string {
  const normalized =
    pathname || '/'

  if (target === 'fa') {
    return normalized.startsWith('/fa')
      ? normalized
      : normalized === '/'
        ? '/fa/'
        : `/fa${normalized}`
  }

  if (!normalized.startsWith('/fa')) {
    return normalized
  }

  const withoutPrefix =
    normalized.slice(3)

  return withoutPrefix || '/'
}

export function Header() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isPersian =
    pathname === '/fa' ||
    pathname.startsWith('/fa/')

  const navItems =
    isPersian
      ? persianNavItems
      : englishNavItems

  const closeMenu = () => setOpen(false)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow =
      document.body.style.overflow

    document.body.style.overflow =
      'hidden'

    const onKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener(
      'keydown',
      onKeyDown,
    )

    return () => {
      document.body.style.overflow =
        previousOverflow

      window.removeEventListener(
        'keydown',
        onKeyDown,
      )
    }
  }, [open])

  return (
    <header
      className="site-header"
      dir={isPersian ? 'rtl' : 'ltr'}
    >
      <div className="container nav">
        <Link
          className="brand"
          href={isPersian ? '/fa/' : '/'}
          aria-label={
            isPersian
              ? 'صفحه اصلی قرص شمار | BeshmarAI'
              : 'BeshmarAI Pill Counter home'
          }
        >
          <Image
            className="brand-logo-image"
            src="/brand/site/logo-full.png"
            alt="قرص شمار | BeshmarAI"
            width={895}
            height={188}
            priority
            sizes="(max-width: 360px) 174px, (max-width: 650px) 190px, 230px"
          />
        </Link>

        <nav
          id="primary-navigation"
          className={
            open
              ? 'nav-links open'
              : 'nav-links'
          }
          aria-label={
            isPersian
              ? 'منوی اصلی'
              : 'Primary navigation'
          }
        >
          {navItems.map((item) => {
            const active = item.match
              ? pathname === item.match ||
                pathname.startsWith(
                  `${item.match}/`,
                )
              : false

            return (
              <Link
                className={[
                  active ? 'active' : '',
                  item.campaign
                    ? 'campaign-nav-link-v4'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                href={item.href}
                key={`${item.href}-${item.label}`}
                aria-current={
                  active
                    ? 'page'
                    : undefined
                }
                onClick={closeMenu}
              >
                {item.campaign ? (
                  <span aria-hidden="true">
                    ✦
                  </span>
                ) : null}
                {item.label}
              </Link>
            )
          })}

          <a
            className="mobile-nav-cta"
            href={siteConfig.appUrl}
            onClick={closeMenu}
          >
            {isPersian
              ? 'شروع شمارش رایگان'
              : 'Start counting free'}
          </a>
        </nav>

        <div className="nav-actions">
          <div
            className="site-language-switch"
            role="group"
            aria-label={
              isPersian
                ? 'انتخاب زبان'
                : 'Language'
            }
          >
            <Link
              className={
                isPersian
                  ? ''
                  : 'active'
              }
              href={switchLanguagePath(
                pathname,
                'en',
              )}
              hrefLang="en"
              lang="en"
            >
              EN
            </Link>
            <Link
              className={
                isPersian
                  ? 'active'
                  : ''
              }
              href={switchLanguagePath(
                pathname,
                'fa',
              )}
              hrefLang="fa"
              lang="fa"
            >
              فارسی
            </Link>
          </div>

          <a
            className="button nav-cta desktop-only"
            href={siteConfig.appUrl}
          >
            {isPersian
              ? 'شروع رایگان'
              : 'Open the free app'}
          </a>

          <button
            type="button"
            className={
              open
                ? 'menu-button active'
                : 'menu-button'
            }
            aria-label={
              open
                ? isPersian
                  ? 'بستن منو'
                  : 'Close menu'
                : isPersian
                  ? 'نمایش منو'
                  : 'Open menu'
            }
            aria-expanded={open}
            aria-controls="primary-navigation"
            onClick={() =>
              setOpen((value) => !value)
            }
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  )
}
