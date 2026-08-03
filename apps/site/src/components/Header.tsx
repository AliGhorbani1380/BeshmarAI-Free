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

const navItems: NavItem[] = [
  { href: '/#how-it-works', label: 'نحوه کار' },
  { href: '/#features', label: 'امکانات' },
  { href: '/campaign', label: 'پویش', match: '/campaign', campaign: true },
  { href: '/pricing', label: 'نسخه رایگان', match: '/pricing' },
  { href: '/blog', label: 'مجله', match: '/blog' },
  { href: '/about', label: 'درباره ما', match: '/about' },
  { href: '/support', label: 'پشتیبانی', match: '/support' },
]

export function Header() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const closeMenu = () => setOpen(false)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <header className="site-header">
      <div className="container nav">
        <Link
          className="brand"
          href="/"
          aria-label="صفحه اصلی قرص شمار | BeshmarAI"
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
          className={open ? 'nav-links open' : 'nav-links'}
          aria-label="منوی اصلی"
        >
          {navItems.map((item) => {
            const active = item.match
              ? pathname === item.match || pathname.startsWith(`${item.match}/`)
              : false

            return (
              <Link
                className={[
                  active ? 'active' : '',
                  item.campaign ? 'campaign-nav-link-v4' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                href={item.href}
                key={`${item.href}-${item.label}`}
                aria-current={active ? 'page' : undefined}
                onClick={closeMenu}
              >
                {item.campaign ? <span aria-hidden="true">✦</span> : null}
                {item.label}
              </Link>
            )
          })}

          <a className="mobile-nav-cta" href={siteConfig.appUrl} onClick={closeMenu}>
            شروع شمارش رایگان
          </a>
        </nav>

        <div className="nav-actions">
          <a className="button nav-cta desktop-only" href={siteConfig.appUrl}>
            شروع رایگان
          </a>

          <button
            type="button"
            className={open ? 'menu-button active' : 'menu-button'}
            aria-label={open ? 'بستن منو' : 'نمایش منو'}
            aria-expanded={open}
            aria-controls="primary-navigation"
            onClick={() => setOpen((value) => !value)}
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
