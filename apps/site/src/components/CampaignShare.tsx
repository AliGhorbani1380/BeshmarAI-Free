'use client'

import { useMemo, useState } from 'react'
import type { ContentLocale } from '@/src/lib/content'

const content = {
  en: {
    url: 'https://beshmarai.ir/campaign?utm_source=organic-share&utm_medium=website&utm_campaign=right-sized-medicine',
    title: 'Right-Sized Medicine Campaign',
    text: 'Medicine matched to need; packaging matched to necessity. I support reducing unused medicine and avoidable packaging without compromising prescription accuracy, safety, or treatment quality.',
    share: 'Share the campaign',
    copy: 'Copy ready-to-share text',
    copied: 'Campaign text copied.',
    shared: 'The share sheet opened.',
    error: 'Sharing failed. Please try again.',
  },
  fa: {
    url: 'https://beshmarai.ir/fa/campaign?utm_source=organic-share&utm_medium=website&utm_campaign=hamandazeh-niyaz',
    title: 'پویش هم‌اندازه نیاز',
    text: 'دارو به اندازه نیاز؛ بسته‌بندی به اندازه ضرورت. من به پویش #هم_اندازه_نیاز پیوستم؛ برای کاهش داروی بلااستفاده و بسته‌بندی غیرضروری، بدون کاهش ایمنی و کیفیت درمان.',
    share: 'اشتراک‌گذاری پویش',
    copy: 'کپی متن آماده',
    copied: 'متن پویش کپی شد.',
    shared: 'پنجره اشتراک‌گذاری باز شد.',
    error: 'اشتراک‌گذاری انجام نشد؛ دوباره تلاش کنید.',
  },
} as const

type ShareState = 'idle' | 'copied' | 'shared' | 'error'

export function CampaignShare({
  locale = 'en',
}: {
  locale?: ContentLocale
}) {
  const [state, setState] = useState<ShareState>('idle')
  const labels = content[locale]

  const feedback = useMemo(() => {
    if (state === 'copied') return labels.copied
    if (state === 'shared') return labels.shared
    if (state === 'error') return labels.error
    return ''
  }, [labels, state])

  const copyCampaign = async () => {
    try {
      await navigator.clipboard.writeText(`${labels.text}\n${labels.url}`)
      setState('copied')
    } catch {
      setState('error')
    }
  }

  const shareCampaign = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: labels.title,
          text: labels.text,
          url: labels.url,
        })
        setState('shared')
        return
      }

      await copyCampaign()
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setState('idle')
        return
      }
      setState('error')
    }
  }

  return (
    <div className="campaign-share-v4">
      <button className="button campaign-primary-v4" type="button" onClick={shareCampaign}>
        {labels.share}<span aria-hidden="true">↗</span>
      </button>
      <button className="button campaign-secondary-v4" type="button" onClick={copyCampaign}>
        {labels.copy}
      </button>
      <p className="campaign-share-feedback-v4" aria-live="polite">{feedback}</p>
    </div>
  )
}
