'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { siteConfig } from '@/src/lib/site'

export function Footer() {
  const pathname = usePathname()

  const isPersian =
    pathname === '/fa' ||
    pathname.startsWith('/fa/')

  const year =
    new Date().getFullYear().toLocaleString(
      isPersian
        ? 'fa-IR'
        : 'en-US',
    )

  const prefix =
    isPersian
      ? '/fa'
      : ''

  return (
    <footer
      className="footer"
      dir={isPersian ? 'rtl' : 'ltr'}
    >
      <div className="container footer-top-v3">
        <div className="footer-brand-column-v3">
          <Link
            className="brand footer-brand"
            href={isPersian ? '/fa/' : '/'}
            aria-label={
              isPersian
                ? 'صفحه اصلی قرص شمار | BeshmarAI'
                : 'BeshmarAI Pill Counter home'
            }
          >
            <Image
              className="brand-logo-image footer-brand-logo-image"
              src="/brand/site/logo-full.png"
              alt="قرص شمار | BeshmarAI"
              width={895}
              height={188}
              sizes="(max-width: 650px) 260px, 300px"
            />
          </Link>

          <p>
            {isPersian
              ? 'راهکار هوشمند شمارش قرص برای تکنسین‌ها و داروخانه‌هایی که سرعت، نظم و تجربه حرفه‌ای می‌خواهند.'
              : 'Private, on-device pill counting for pharmacy teams that need speed, consistency, and a professional workflow.'}
          </p>

          <a
            className="footer-app-link-v3"
            href={siteConfig.appUrl}
          >
            {isPersian
              ? 'ورود به قرص شمار'
              : 'Open BeshmarAI'}
            <span aria-hidden="true">
              {isPersian ? '←' : '→'}
            </span>
          </a>
        </div>

        <div className="footer-links-v3">
          <strong>
            {isPersian
              ? 'محصول'
              : 'Product'}
          </strong>
          <Link href={`${prefix}/#how-it-works`}>
            {isPersian
              ? 'نحوه کار'
              : 'How it works'}
          </Link>
          <Link href={`${prefix}/#features`}>
            {isPersian
              ? 'امکانات'
              : 'Features'}
          </Link>
          <Link href={`${prefix}/pricing`}>
            {isPersian
              ? 'نسخه رایگان'
              : 'Free edition'}
          </Link>
          <Link
            className="footer-campaign-link-v4"
            href={`${prefix}/campaign`}
          >
            {isPersian
              ? 'پویش هم‌اندازه نیاز'
              : 'Right-sized medicine campaign'}
          </Link>
          <a href={siteConfig.appUrl}>
            {isPersian
              ? 'شروع شمارش'
              : 'Start counting'}
          </a>
        </div>

        <div className="footer-links-v3">
          <strong>
            {isPersian
              ? 'محتوا'
              : 'Insights'}
          </strong>
          <Link href={`${prefix}/blog`}>
            {isPersian
              ? 'مجله قرص شمار'
              : 'BeshmarAI insights'}
          </Link>
          <Link href={`${prefix}/category/pill-counting`}>
            {isPersian
              ? 'شمارش قرص'
              : 'Pill counting'}
          </Link>
          <Link href={`${prefix}/category/pharmacy-technician`}>
            {isPersian
              ? 'آموزش تکنسین'
              : 'Technician training'}
          </Link>
          <Link href={`${prefix}/category/responsible-medicine-use`}>
            {isPersian
              ? 'مصرف مسئولانه دارو'
              : 'Responsible medicine use'}
          </Link>
        </div>

        <div className="footer-links-v3">
          <strong>
            {isPersian
              ? 'پشتیبانی و قوانین'
              : 'Support and policies'}
          </strong>
          <Link href={`${prefix}/support`}>
            {isPersian
              ? 'پشتیبانی'
              : 'Support'}
          </Link>
          <Link href={`${prefix}/safety`}>
            {isPersian
              ? 'راهنمای ایمنی'
              : 'Safety'}
          </Link>
          <Link href={`${prefix}/privacy`}>
            {isPersian
              ? 'حریم خصوصی'
              : 'Privacy'}
          </Link>
          <Link href={`${prefix}/terms`}>
            {isPersian
              ? 'قوانین استفاده'
              : 'Terms'}
          </Link>
        </div>
      </div>

      <div className="container copyright">
        <span>
          {isPersian
            ? `© ${year} قرص شمار | BeshmarAI؛ تمامی حقوق محفوظ است.`
            : `© ${year} BeshmarAI | قرص شمار. All rights reserved.`}
        </span>
        <a
          href={`mailto:${siteConfig.supportEmail}`}
        >
          {siteConfig.supportEmail}
        </a>
      </div>
    </footer>
  )
}
