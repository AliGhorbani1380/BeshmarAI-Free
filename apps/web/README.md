# BeshmarAI Free Web App

برنامه رایگان شمارش قرص برای انتشار در مسیر `/app/`.

مدل‌ها از `public/models/public-v1/manifest.json` خوانده می‌شوند. هر قطعه و
مدل بازسازی‌شده پیش از استفاده با SHA-256 بررسی می‌شود و در Cache Storage
مرورگر نگهداری می‌شود.

```powershell
npm ci
npm run verify:runtime
npm run typecheck
npm run build
```

مدل‌های عمومی باید پیش از Build نهایی توسط اسکریپت Stage 2 بسته‌بندی شوند.
