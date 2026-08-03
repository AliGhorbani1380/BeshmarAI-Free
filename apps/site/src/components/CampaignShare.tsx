'use client'

import { useMemo, useState } from 'react'

const campaignUrl =
  'https://beshmarai.ir/campaign?utm_source=organic-share&utm_medium=website&utm_campaign=hamandazeh-niyaz'

const campaignText =
  'دارو به اندازه نیاز؛ بسته‌بندی به اندازه ضرورت. من به پویش #هم_اندازه_نیاز پیوستم؛ برای کاهش داروی بلااستفاده و بسته‌بندی غیرضروری، بدون کاهش ایمنی و کیفیت درمان.'

type ShareState = 'idle' | 'copied' | 'shared' | 'error'

export function CampaignShare() {
  const [state, setState] = useState<ShareState>('idle')

  const feedback = useMemo(() => {
    if (state === 'copied') {
      return 'متن پویش کپی شد.'
    }

    if (state === 'shared') {
      return 'پنجره اشتراک‌گذاری باز شد.'
    }

    if (state === 'error') {
      return 'اشتراک‌گذاری انجام نشد؛ دوباره تلاش کنید.'
    }

    return ''
  }, [state])

  const copyCampaign = async () => {
    try {
      await navigator.clipboard.writeText(`${campaignText}\n${campaignUrl}`)
      setState('copied')
    } catch {
      setState('error')
    }
  }

  const shareCampaign = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'پویش هم‌اندازه نیاز',
          text: campaignText,
          url: campaignUrl,
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
        اشتراک‌گذاری پویش
        <span aria-hidden="true">↗</span>
      </button>
      <button className="button campaign-secondary-v4" type="button" onClick={copyCampaign}>
        کپی متن آماده
      </button>
      <p className="campaign-share-feedback-v4" aria-live="polite">
        {feedback}
      </p>
    </div>
  )
}
