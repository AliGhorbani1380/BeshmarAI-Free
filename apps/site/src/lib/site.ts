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
  supportPhoneDisplay: '+98 921 331 4813',
  supportPhoneE164: '+989213314813',
  supportPhoneHref: 'tel:+989213314813',
  creatorName: 'Ali Ghorbani Bargani',
  creatorNameFa: 'علی قربانی بارگانی',
  creatorRole: 'Creator and maintainer',
  creatorRoleFa: 'سازنده و نگهدارنده پروژه',
  githubUrl: 'https://github.com/AliGhorbani1380/BeshmarAI-Free',
  githubProfileUrl: 'https://github.com/AliGhorbani1380',
  linkedinUrl: 'https://www.linkedin.com/in/ali-ghorbani-66b57a278/',
} as const
