const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') ||
  'https://beshmarai.ir'

export const siteConfig = {
  name: 'BeshmarAI | قرص شمار',
  englishName: 'BeshmarAI',
  persianName: 'قرص شمار',
  description:
    'Free, private, on-device AI pill counting for pharmacy teams. No sign-in, no subscription, and pill images stay on your device.',
  descriptionFa:
    'قرص شمار BeshmarAI؛ شمارش رایگان قرص با هوش مصنوعی روی دستگاه کاربر، بدون ورود و بدون ارسال تصویر به سرور.',
  url: baseUrl,
  appUrl: `${baseUrl}/app/`,
  campaignUrl: `${baseUrl}/campaign/`,
  campaignUrlFa: `${baseUrl}/fa/campaign/`,
  supportEmail: 'support@beshmarai.ir',
  githubUrl: 'https://github.com/AliGhorbani1380/BeshmarAI-Free',
} as const
