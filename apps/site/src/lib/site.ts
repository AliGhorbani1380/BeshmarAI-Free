export const siteConfig = {
  name: 'قرص شمار | BeshmarAI',
  persianName: 'قرص شمار',
  englishName: 'BeshmarAI',
  description:
    'قرص شمار BeshmarAI؛ شمارش رایگان قرص با هوش مصنوعی روی دستگاه کاربر، بدون ورود و بدون ارسال تصویر به سرور.',
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') ||
    'https://beshmarai.ir',
  appUrl:
    `${
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') ||
      'https://beshmarai.ir'
    }/app/`,
  campaignUrl: 'https://beshmarai.ir/campaign/',
  supportEmail: 'support@beshmarai.ir',
} as const
