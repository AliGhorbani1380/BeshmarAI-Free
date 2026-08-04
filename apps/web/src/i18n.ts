export type AppLanguage =
  | 'en'
  | 'fa'

const languageStorageKey =
  'beshmarai_language_v1'

const originalText =
  new WeakMap<Text, string>()

const originalAttributes =
  new WeakMap<
    Element,
    Map<string, string>
  >()

const lastAppliedText =
  new WeakMap<Text, string>()

const lastAppliedAttributes =
  new WeakMap<
    Element,
    Map<string, string>
  >()

let activeLanguage:
  AppLanguage = 'en'

let internalMutation = false

const exactTranslations =
  new Map<string, string>([
    ['؟', 'Help'],
    ['کل', 'Total'],
    ['مدل', 'Model'],
    ['سایت', 'Website'],
    ['تله', 'Telephoto'],
    ['پشت', 'Rear'],
    ['سلفی', 'Selfie'],
    ['فعال', 'Active'],
    ['پایدار', 'Stable'],
    ['بازگشت', 'Back'],
    ['تنظیمات', 'Settings'],
    ['پردازنده', 'Processor'],
    ['پشتیبانی', 'Support'],
    ['درباره ما', 'About us'],
    ['درباره قرص شمار', 'About BeshmarAI'],
    ['مشخصات و راه‌های ارتباطی', 'Details and contact'],
    ['مشخصات پروژه و راه‌های ارتباطی', 'Project details and contact'],
    ['مشخصات و تماس', 'Details and contact'],
    ['سازنده و نگهدارنده', 'Creator and maintainer'],
    ['سازنده و نگهدارنده نسخه عمومی', 'Creator and maintainer of the public edition'],
    ['علی قربانی بارگانی', 'Ali Ghorbani Bargani'],
    ['تلفن پشتیبانی', 'Support phone'],
    ['ایمیل پشتیبانی', 'Support email'],
    ['لینک‌های رسمی', 'Official links'],
    ['وب‌سایت، کد عمومی و پروفایل سازنده', 'Website, public source, and creator profile'],
    ['تماس با پشتیبانی', 'Call support'],
    ['ارسال ایمیل', 'Send email'],
    ['بازکردن وب‌سایت', 'Open website'],
    ['مشاهده مخزن عمومی', 'View public repository'],
    ['پروفایل گیت‌هاب سازنده', 'Creator GitHub profile'],
    ['مشاهده لینکدین', 'View LinkedIn'],
    ['هشدار ایمنی', 'Safety notice'],
    ['هر نتیجه را بازبینی کنید', 'Review every result'],
    ['قرص شمار یک کمک‌ابزار بینایی ماشین برای شمارش سریع و قابل بررسی قرص است. برنامه و مدل روی دستگاه شما اجرا می‌شوند و تصویر شمارش برای پردازش به سرور ارسال نمی‌شود.', 'BeshmarAI is a computer-vision assistant for fast, reviewable pill counting. The app and model run on your device, and counting images are not sent to a server for processing.'],
    ['حریم خصوصی در معماری: بدون حساب کاربری، OTP، پرداخت، اشتراک یا Endpoint ارسال تصویر.', 'Privacy by architecture: no account, OTP, payment, subscription, or image-upload endpoint.'],
    ['قرص شمار دارو را شناسایی نمی‌کند، دوز را تأیید نمی‌کند و جایگزین داروساز، مسئول فنی یا رویه‌های قانونی نیست. عدد پیشنهادی و نشانه‌های تشخیص را پیش از استفاده بررسی کنید.', 'BeshmarAI does not identify medicine, verify dosage, or replace a pharmacist, responsible professional, or legal procedure. Review the suggested count and detections before use.'],
    ['آماده‌سازی', 'Preparation'],
    ['تعداد دقیق', 'Accurate count'],
    ['تعداد قرص:', 'Pill count:'],
    ['تماس تلفنی', 'Phone support'],
    ['ساخت موتور', 'Session creation'],
    ['شروع شمارش', 'Start counting'],
    ['نوع دسترسی', 'Access type'],
    ['ابعاد تصویر', 'Image dimensions'],
    ['تلاش دوباره', 'Try again'],
    ['دسترسی شمارش', 'Counting access'],
    ['وب‌سایت رسمی', 'Official website'],
    ['پردازش نتیجه', 'Post-processing'],
    ['انتخاب خودکار', 'Automatic selection'],
    ['راهنمای شمارش', 'Counting guide'],
    ['سوالات متداول', 'Frequently asked questions'],
    ['لنز ذخیره‌شده', 'Saved lens'],
    ['محدودیت زمانی', 'Time limit'],
    ['دوربین باز نشد', 'Camera could not open'],
    ['شمارش کامل نشد', 'Counting did not complete'],
    ['تنظیم مجدد رابط', 'Reset interface'],
    ['۲ رشته — متعادل', '2 threads — balanced'],
    ['آموزش گام به گام', 'Step-by-step guide'],
    ['حد اطمینان تشخیص', 'Detection confidence'],
    ['لنز مورد استفاده', 'Camera lens'],
    ['موتور شمارش دقیق', 'Accurate-count engine'],
    ['پاسخ مشکلات رایج', 'Common troubleshooting'],
    ['انتخاب لنز دوربین', 'Camera lens selection'],
    ['در حال اسکن تصویر', 'Scanning image'],
    ['آماده‌سازی runtime', 'Runtime preparation'],
    ['تعداد رشته‌های CPU', 'CPU thread count'],
    ['تنظیمات شمارش دقیق', 'Accurate-count settings'],
    ['دوربین و دقت شمارش', 'Camera and counting accuracy'],
    ['راهنمای نصب برنامه', 'Installation guide'],
    ['آماده‌سازی کامل نشد', 'Setup did not complete'],
    ['افزودن به صفحه اصلی', 'Add to Home Screen'],
    ['انتخاب خودکار فعلی:', 'Current automatic choice:'],
    ['در حال تحلیل قرص‌ها', 'Analyzing pills'],
    ['دوربین و شمارش دقیق', 'Camera and accurate counting'],
    ['۱ رشته — پایدارترین', '1 thread — most stable'],
    ['برای کاربران حرفه‌ای', 'For advanced users'],
    ['حذف کادرهای هم‌پوشان', 'Overlapping-box suppression'],
    ['تشخیص دوباره لنز اصلی', 'Detect the main lens again'],
    ['انتخاب خودکار پیشنهادی', 'Automatic — recommended'],
    ['لطفاً چند لحظه صبر کنید', 'Please wait a moment'],
    ['پاک‌کردن پیام‌های برنامه', 'Clear app messages'],
    ['استراتژی اجرای هوش مصنوعی', 'AI execution strategy'],
    ['انتخاب خودکار، GPU یا CPU', 'Choose automatic, GPU, or CPU'],
    ['انتخاب خودکار لنز اصلی پشت', 'Automatically select the main rear lens'],
    ['حالت خودکار پیشنهاد می‌شود', 'Automatic mode is recommended'],
    ['سنجش دوباره و انتخاب خودکار', 'Re-detect and select automatically'],
    ['۴ رشته — سریع برای دستگاه قوی', '4 threads — faster on powerful devices'],
    ['بازگردانی تنظیمات پیشنهادی مدل', 'Restore recommended model settings'],
    ['GPU — WebGPU با بازگشت امن به CPU', 'GPU — WebGPU with safe CPU fallback'],
    ['CPU — WebAssembly', 'CPU — WebAssembly'],
    ['هنوز سنجیده نشده', 'Not measured yet'],
    ['موتور مؤثر فعلی:', 'Current effective engine:'],
    ['منوی اصلی', 'Main menu'],
    ['انتخاب زوم', 'Select zoom'],
    ['دوربین جلو', 'Front camera'],
    ['دوربین پشت', 'Rear camera'],
    ['شمارش دقیق', 'Accurate count'],
    ['بازکردن امن', 'Secure opening'],
    ['به‌روزرسانی', 'Update'],
    ['نسخه رایگان', 'Free edition'],
    ['بدون محدودیت', 'Unlimited'],
    ['عمومی رایگان', 'Free public access'],
    ['فوق عریض', 'Ultra-wide'],
    ['فوق‌عریض', 'Ultra-wide'],
    ['قرص‌شمار', 'Pill Counter'],
    ['فلش روشن شد.', 'Flash turned on.'],
    ['بازگشت به منو', 'Back to menu'],
    ['در حال نصب...', 'Installing...'],
    ['روشن کردن فلش', 'Turn on flash'],
    ['فلش خاموش شد.', 'Flash turned off.'],
    ['فوق‌عریض ۰٫۵×', 'Ultra-wide 0.5×'],
    ['خاموش کردن فلش', 'Turn off flash'],
    ['نوع لنز نامشخص', 'Unknown lens type'],
    ['خطای شمارش دقیق', 'Accurate-count error'],
    ['در حال شمارش...', 'Counting...'],
    ['دوربین اصلی پشت', 'Main rear camera'],
    ['کنترل‌های شمارش', 'Counting controls'],
    ['باز کردن تنظیمات', 'Open settings'],
    ['بزرگ‌نمایی تصویر', 'Zoom in'],
    ['نتیجه شمارش دقیق', 'Accurate-count result'],
    ['نمای زنده دوربین', 'Live camera view'],
    ['وضعیت نسخه عمومی', 'Public-edition status'],
    ['کوچک‌نمایی تصویر', 'Zoom out'],
    ['در حال شمارش دقیق', 'Accurate counting in progress'],
    ['شمارش دقیق ناموفق', 'Accurate counting failed'],
    ['نسخه عمومی رایگان', 'Free public edition'],
    ['قرص‌شمار BeshmarAI', 'BeshmarAI Pill Counter'],
    ['نسخه جدید آماده است', 'A new version is ready'],
    ['مدل نهایی ۱۵۳۶ پیکسل', 'Final 1536-pixel model'],
    ['بستن نتیجه شمارش دقیق', 'Close accurate-count result'],
    ['کادر را جابه‌جا کنید.', 'Move the frame.'],
    ['کادر قابل تنظیم شمارش', 'Adjustable counting frame'],
    ['تصویر ثابت در حال اسکن', 'Scanning frozen image'],
    ['احتمالاً دوربین اصلی ۱×', 'Likely the main 1× camera'],
    ['تصویر ثابت شمارش ناموفق', 'Frozen-image count failed'],
    ['در حال تکمیل راه‌اندازی', 'Completing setup'],
    ['دوربین هنوز آماده نیست.', 'The camera is not ready yet.'],
    ['در حال اسکن و شمارش دقیق', 'Scanning and counting accurately'],
    ['در حال بازیابی دوربین...', 'Restoring camera...'],
    ['شمارش لحظه‌ای متوقف است.', 'Live counting is paused.'],
    ['پیشرفت تقریبی آماده‌سازی', 'Approximate setup progress'],
    ['کنترل‌های دوربین روی تصویر', 'On-image camera controls'],
    ['در حال آماده‌سازی دوربین...', 'Preparing camera...'],
    ['در حال بررسی حافظه داخلی...', 'Checking local storage...'],
    ['در حال آماده‌سازی شمارش زنده', 'Preparing live counting'],
    ['در حال شروع شمارش لحظه‌ای...', 'Starting live counting...'],
    ['دوربین موقتاً متوقف شده است.', 'The camera is temporarily paused.'],
    ['تنظیم یک‌باره برای این دستگاه', 'One-time setup for this device'],
    ['در حال دانلود هوش مصنوعی دقیق', 'Downloading the accurate AI model'],
    ['دوربین و هوش مصنوعی آماده‌اند', 'Camera and AI are ready'],
    ['در حال ورود به دوربین شمارش...', 'Opening the counting camera...'],
    ['مدل مخصوص iOS هنوز آماده نیست.', 'The iOS model is not ready yet.'],
    ['در حال آماده‌سازی هوش مصنوعی...', 'Preparing AI...'],
    ['در حال شمارش محلی روی iPhone...', 'Counting locally on iPhone...'],
    ['در حال نهایی‌سازی محیط شمارش...', 'Finalizing the counting environment...'],
    ['در حال بارگذاری مدل مخصوص iOS...', 'Loading the iOS model...'],
    ['فریم یا ROI معتبر در دسترس نیست.', 'No valid frame or ROI is available.'],
    ['در حال استخراج تصویر داخل کادر...', 'Extracting the image inside the frame...'],
    ['در حال بازگشت به شمارش لحظه‌ای...', 'Returning to live counting...'],
    ['در حال ساخت موتور مستقل WebGPU...', 'Creating the isolated WebGPU engine...'],
    ['استراتژی اجرا ذخیره شد؛ در حال آماده‌سازی دوباره موتور شمارش...', 'The execution strategy was saved. Rebuilding the counting engine...'],
    ['انتخاب خودکار ذخیره شد و بهترین موتور پایدار این دستگاه دوباره انتخاب شد.', 'Automatic mode was saved and the best stable engine for this device was selected again.'],
    ['برای نمایش نام لنزها، ابتدا یک‌بار دوربین را باز کنید.', 'Open the camera once to display the available lens names.'],
    ['تنظیمات ذخیره شد. موتور جدید هنگام شمارش دقیق بعدی آماده می‌شود.', 'Settings were saved. The new engine will be prepared for the next accurate count.'],
    ['حالت CPU ذخیره شد و از شمارش دقیق بعدی اعمال می‌شود.', 'CPU mode was saved and will apply to the next accurate count.'],
    ['حالت GPU ذخیره شد. در صورت ناسازگاری، برنامه به‌صورت خودکار از CPU استفاده می‌کند.', 'GPU mode was saved. If it is incompatible, the app will automatically fall back to CPU.'],
    ['در حال تثبیت', 'Stabilizing'],
    ['زوم x', 'Zoom x'],
    ['قرص‌ها را داخل محدوده قرار دهید و شمارش دقیق را بزنید.', 'Place the pills inside the frame, then start an accurate count.'],
    ['دوربین هنوز آماده ثبت تصویر نیست.', 'The camera is not ready to capture an image.'],
    ['در حال آماده‌سازی مدل دقیق ۱۱۵۲...', 'Preparing the 1152 accurate model...'],
    ['اعمال زوم روی این دوربین ممکن نیست.', 'Zoom control is unavailable on this camera.'],
    ['استراتژی WebGPU این دستگاه ذخیره شد.', 'The WebGPU strategy was saved for this device.'],
    ['این دستگاه امکان کنترل فلش را ندارد.', 'Flash control is unavailable on this device.'],
    ['در حال بررسی مدل عمومی شمارش زنده...', 'Checking the public live-count model...'],
    ['تنظیمات به‌صورت خودکار ذخیره می‌شوند.', 'Settings are saved automatically.'],
    ['نسخه پایه وب با موفقیت آماده شده است.', 'The web app is ready.'],
    ['پیشرفت آماده‌سازی دوربین و هوش مصنوعی', 'Camera and AI setup progress'],
    ['تبدیل ROI به مختصات دوربین ناموفق بود.', 'Could not map the ROI to camera coordinates.'],
    ['دوربین یا مدل لحظه‌ای هنوز آماده نیست.', 'The camera or live model is not ready yet.'],
    ['فریم دوربین هنوز کامل دریافت نشده است.', 'A complete camera frame has not been received yet.'],
    ['کنترل فلش در این مرورگر در دسترس نیست.', 'Flash control is unavailable in this browser.'],
    ['نتیجه آماده شد؛ در حال ترسیم باکس‌ها...', 'Result ready; drawing detections...'],
    ['گوشه را بکشید تا اندازه کادر تغییر کند.', 'Drag a corner to resize the frame.'],
    ['مدل شمارش زنده از حافظه دستگاه آماده شد.', 'The live-count model is ready from local storage.'],
    ['اطلاعات دوربین یا کادر ROI در دسترس نیست.', 'Camera or ROI information is unavailable.'],
    ['تصویر ثابت شد؛ در حال اسکن و شمارش دقیق...', 'Image frozen; running the accurate count...'],
    ['تنظیمات تشخیص به مقدارهای پیشنهادی بازگشت.', 'Detection settings were restored to recommended values.'],
    ['مدل‌ها آماده‌اند؛ در حال بازکردن برنامه...', 'Models are ready; opening the app...'],
    ['تصویر ثابت شده و مدل ۱۵۳۶ در حال پردازش است', 'The image is frozen and the 1536 model is processing it'],
    ['در حال انتخاب سریع‌ترین تنظیم پایدار CPU...', 'Selecting the fastest stable CPU configuration...'],
    ['در حال بررسی قطعه‌های ذخیره‌شده مدل دقیق...', 'Checking stored accurate-model parts...'],
    ['شمارش لحظه‌ای برای اجرای مدل دقیق متوقف شد.', 'Live counting paused for the accurate model.'],
    ['هیچ تنظیم CPU سازگار دیگری باقی نمانده است.', 'No other compatible CPU configuration remains.'],
    ['پس از تنظیم کادر، دکمه شمارش دقیق را بزنید.', 'Adjust the frame, then press Accurate Count.'],
    ['در حال سنجش یک‌باره توان واقعی این دستگاه...', 'Measuring this device once...'],
    ['زوم سخت‌افزاری روی این دستگاه در دسترس نیست.', 'Hardware zoom is unavailable on this device.'],
    ['تصاویر شما برای شمارش به سرور ارسال نمی‌شوند.', 'Your images are never sent to a server for counting.'],
    ['در حال سنجش یک‌باره توان مرورگر و سخت‌افزار...', 'Measuring browser and hardware capabilities once...'],
    ['تصویر ثابت برای بررسی و تلاش دوباره حفظ شده است', 'The frozen image is preserved for review and retry'],
    ['در حال بررسی مجوز دوربین و انتخاب بهترین لنز...', 'Checking camera permission and selecting the best lens...'],
    ['همه‌چیز آماده است؛ نمای شمارش در حال نمایش است.', 'Everything is ready; opening the counting view.'],
    ['برنامه و مدل شمارش برای استفاده آفلاین آماده شدند.', 'The app and counting model are ready for offline use.'],
    ['تصویر نتیجه؛ با دو انگشت زوم کنید و تصویر را بکشید', 'Result image; pinch to zoom and drag to pan'],
    ['در حال بارگذاری امن مدل دقیق برای موتور گرافیکی...', 'Securely loading the accurate model for the GPU engine...'],
    ['مدل دقیق روی شتاب‌دهنده گرافیکی در حال اجرا است...', 'The accurate model is running on the GPU...'],
    ['موتور انتخاب‌شده WebGPU در پس‌زمینه آماده می‌شود...', 'The selected WebGPU engine is preparing in the background...'],
    ['مرورگر این دستگاه دسترسی دوربین را پشتیبانی نمی‌کند.', 'This browser does not support camera access.'],
    ['مدل شمارش لحظه‌ای آماده شد؛ در حال تکمیل محیط شمارش...', 'The live-count model is ready; finalizing the counting environment...'],
    ['تنظیمات مدل ذخیره شد و از شمارش دقیق بعدی اعمال می‌شود.', 'Model settings were saved and will apply to the next accurate count.'],
    ['در حال تنظیم یک‌باره این دستگاه برای سریع‌ترین شمارش...', 'Running one-time setup for the fastest counting...'],
    ['هر دو مدل روی دستگاه آماده‌اند؛ در حال ورود به برنامه...', 'Both models are ready on this device; opening the app...'],
    ['داخل کادر را بکشید؛ گوشه‌ها اندازه کادر را تغییر می‌دهند.', 'Drag inside the frame to move it; drag corners to resize it.'],
    ['سرعت آماده‌سازی به اینترنت و توان پردازشی گوشی بستگی دارد.', 'Setup speed depends on your connection and device performance.'],
    ['لنز دستی ذخیره شد و در ورود بعدی به دوربین استفاده می‌شود.', 'The selected lens was saved for the next camera session.'],
    ['لنز مناسب انتخاب شد؛ در حال دریافت تصویر زنده از دوربین...', 'The best lens was selected; receiving the live camera feed...'],
    ['دسترسی دوربین برقرار نشد. مجوز دوربین مرورگر را بررسی کنید.', 'Camera access failed. Check the browser camera permission.'],
    ['مدل شمارش دقیق در حال دانلود است؛ لطفاً این صفحه را نبندید.', 'The accurate-count model is downloading; keep this page open.'],
    ['تنظیمات دوربین و مدل شمارش لحظه‌ای در حال اتصال نهایی هستند.', 'Finalizing camera and live-model integration.'],
    ['در حال انتخاب بهترین موتور شمارش برای سخت‌افزار این دستگاه...', 'Selecting the best counting engine for this device...'],
    ['ذخیره دائمی مدل روی حافظه داخلی در این مرورگر پشتیبانی نمی‌شود.', 'Persistent model storage is unavailable in this browser.'],
    ['مدل دقیق حدود ۸۰ مگابایت است و مستقیماً روی دستگاه آماده می‌شود.', 'The accurate model is about 80 MB and is prepared directly on your device.'],
    ['برنامه فقط پس از آماده‌شدن واقعی فایل‌های مدل وارد منوی اصلی می‌شود.', 'The main menu opens only after the model files are ready.'],
    ['موتور گرافیکی با این مدل سازگار نبود؛ در حال انتقال به مسیر مطمئن CPU...', 'The GPU engine was incompatible; switching to the safe CPU path...'],
    ['انتخاب قبلی پاک شد. در ورود بعدی به دوربین، لنز اصلی دوباره بررسی می‌شود.', 'The previous choice was cleared. The main lens will be detected again next time.'],
    ['راهنمای شمارش: قرص‌ها را جدا از هم، زیر نور یکنواخت و داخل کادر قرار دهید.', 'Counting guide: separate the pills, use even lighting, and keep them inside the frame.'],
    ['در ورود بعدی به دوربین، بهترین لنز پشت دوباره به‌صورت خودکار شناسایی می‌شود.', 'The best rear lens will be detected automatically next time.'],
    ['برای نصب، گزینه Add to Home Screen یا نصب برنامه را از منوی مرورگر انتخاب کنید.', 'To install, choose Add to Home Screen or Install App from your browser menu.'],
    ['پاسخ مشکلات رایج: نور، فاصله دوربین، تمیزی لنز و جدا بودن قرص‌ها را بررسی کنید.', 'Troubleshooting: check lighting, camera distance, lens cleanliness, and pill separation.'],
    ['WebGPU این مدل را پایدار اجرا نکرد؛ در حال انتقال کنترل‌شده به Worker سازگار CPU...', 'WebGPU could not run this model reliably; switching safely to a compatible CPU worker...'],
    ['پس از پایان، استراتژی مناسب این دستگاه ذخیره و در دفعات بعد مستقیماً استفاده می‌شود.', 'The selected strategy will be saved and reused directly on future runs.'],
    ['مدل شمارش لحظه‌ای در حال آماده‌سازی است؛ موتور دقیق بر اساس توان دستگاه مدیریت می‌شود.', 'The live model is preparing; the accurate engine is managed according to device capability.'],
    ['برای شروع دوباره، صفحه را بازخوانی کنید. تنظیمات شمارش از بخش تنظیمات قابل بازگردانی است.', 'Reload the page to start again. Counting settings can be restored from Settings.'],
    ['لطفاً چند لحظه صبر کنید و صفحه را نبندید.', 'Please wait and keep this page open.'],
    ['دو انگشت برای زوم · کشیدن برای جابه‌جایی · دوبار لمس برای بازنشانی', 'Pinch to zoom · drag to pan · double-tap to reset'],
    ['نام لنزها هنوز در دسترس نیست. یک‌بار وارد صفحه دوربین شوید و مجوز دوربین را صادر کنید.', 'Lens names are not available yet. Open the camera once and grant permission.'],
    ['تصویر ثابت باقی مانده است. شرایط نور، فاصله و فوکوس را اصلاح کنید و دوباره شمارش را اجرا کنید.', 'The image remains frozen. Improve lighting, distance, or focus and run the count again.'],
    ['مقدار بالاتر تشخیص‌های ضعیف را حذف می‌کند؛ مقدار خیلی بالا ممکن است بعضی قرص‌ها را از دست بدهد.', 'A higher value removes weak detections; setting it too high may miss some pills.'],
    ['مدل دقیق فقط یک‌بار روی حافظه داخلی ذخیره می‌شود؛ دفعات بعد بدون دانلود از همان نسخه استفاده خواهد شد.', 'The accurate model is stored locally once and reused without downloading again.'],
    ['دایره‌های فیروزه‌ای محل قرص‌های شمرده‌شده را مشخص می‌کنند. با زوم و جابه‌جایی، نتیجه را کامل بررسی کنید.', 'Turquoise circles mark counted pills. Zoom and pan to review the full result.'],
    ['برنامه در حالت خودکار از جهت دوربین، نام لنز، قابلیت فلش و مشخصات Track برای انتخاب دوربین اصلی استفاده می‌کند.', 'Automatic mode uses camera direction, lens name, flash support, and track capabilities to select the main camera.'],
    ['حالت خودکار توان دستگاه را یک‌بار می‌سنجد و نتیجه را ذخیره می‌کند. حالت GPU سریع‌تر است، اما در صورت ناسازگاری به مسیر امن CPU برمی‌گردد.', 'Automatic mode measures the device once and saves the result. GPU is usually faster, with a safe CPU fallback.'],
  ])

const attributeNames = [
  'aria-label',
  'title',
  'placeholder',
  'alt',
] as const

function toLatinDigits(
  input: string,
): string {
  const persianDigits =
    '۰۱۲۳۴۵۶۷۸۹'

  const arabicDigits =
    '٠١٢٣٤٥٦٧٨٩'

  return input
    .replace(
      /[۰-۹]/g,
      (digit) =>
        String(
          persianDigits.indexOf(
            digit,
          ),
        ),
    )
    .replace(
      /[٠-٩]/g,
      (digit) =>
        String(
          arabicDigits.indexOf(
            digit,
          ),
        ),
    )
}

function translateDynamic(
  input: string,
): string {
  const originalTrimmed =
    input.trim()

  const exactOriginal =
    exactTranslations.get(
      originalTrimmed,
    )

  if (exactOriginal) {
    return input.replace(
      originalTrimmed,
      exactOriginal,
    )
  }

  let value =
    toLatinDigits(input)

  const exact =
    exactTranslations.get(
      value.trim(),
    )

  if (exact) {
    return value.replace(
      value.trim(),
      exact,
    )
  }

  const patterns:
    [
      RegExp,
      (...values: string[]) => string,
    ][] = [
      [
        /^دوربین\s+(\d+)$/,
        (_match, index) =>
          `Camera ${index}`,
      ],
      [
        /^WASM\s+(\d+)\s+رشته$/,
        (_match, threads) =>
          `WASM — ${threads} threads`,
      ],
      [
        /^(\d+)\s+ثانیه$/,
        (_match, seconds) =>
          `${seconds} seconds`,
      ],
      [
        /^(\d+)\s+دقیقه(?:\s+و\s*)?$/,
        (_match, minutes) =>
          `${minutes} minutes`,
      ],
      [
        /^شمارش دقیق انجام شد:\s*(.+)\s+قرص\.$/,
        (_match, count) =>
          `Accurate count completed: ${count} pills.`,
      ],
      [
        /^در حال دانلود\s+(.+)\.\.\.$/,
        (_match, label) =>
          `Downloading ${label}...`,
      ],
      [
        /^(.+)\s+روی دستگاه ذخیره شد\.$/,
        (_match, label) =>
          `${label} was saved on this device.`,
      ],
      [
        /^(.+)\s+از حافظه دستگاه بررسی شد\.$/,
        (_match, label) =>
          `${label} was verified from device storage.`,
      ],
      [
        /^(.+)\s+روی حافظه داخلی ذخیره شد\.$/,
        (_match, label) =>
          `${label} was saved to local storage.`,
      ],
      [
        /^در حال بررسی فایل ذخیره‌شده\s+(.+)\.\.\.$/,
        (_match, label) =>
          `Checking stored ${label}...`,
      ],
      [
        /^در حال بررسی نسخه ذخیره‌شده\s+(.+)\.\.\.$/,
        (_match, label) =>
          `Checking the stored ${label} version...`,
      ],
      [
        /^در حال خواندن\s+(.+)\s+از حافظه داخلی\.\.\.$/,
        (_match, label) =>
          `Reading ${label} from local storage...`,
      ],
      [
        /^در حال ذخیره\s+(.+)\s+روی حافظه داخلی\.\.\.$/,
        (_match, label) =>
          `Saving ${label} to local storage...`,
      ],
      [
        /^استراتژی CPU با\s+(\d+)\s+رشته ذخیره شد\.$/,
        (_match, threads) =>
          `The CPU strategy was saved with ${threads} threads.`,
      ],
      [
        /^در حال ساخت موتور مستقل WASM با\s+(\d+)\s+رشته\.\.\.$/,
        (_match, threads) =>
          `Creating the isolated WASM engine with ${threads} threads...`,
      ],
      [
        /^مدل دقیق روی CPU با\s+(\d+)\s+رشته در حال اجرا است\.\.\.$/,
        (_match, threads) =>
          `The accurate model is running on CPU with ${threads} threads...`,
      ],
      [
        /^موتور انتخاب‌شده CPU با\s+(\d+)\s+رشته در پس‌زمینه آماده می‌شود\.\.\.$/,
        (_match, threads) =>
          `The selected CPU engine is preparing in the background with ${threads} threads...`,
      ],
      [
        /^در حال بارگذاری امن مدل دقیق برای موتور سازگار\s+(\d+)\s+رشته‌ای\.\.\.$/,
        (_match, threads) =>
          `Securely loading the accurate model for the compatible ${threads}-thread engine...`,
      ],
      [
        /^تنظیم\s+(\d+)\s+رشته پایدار نبود؛ در حال امتحان حالت\s+(\d+)\s+رشته\.\.\.$/,
        (_match, previous, next) =>
          `${previous} threads was not stable; trying ${next} threads...`,
      ],
    ]

  for (const [
    pattern,
    replacement,
  ] of patterns) {
    const match =
      value.trim().match(
        pattern,
      )

    if (match) {
      return value.replace(
        value.trim(),
        replacement(...match),
      )
    }
  }

  const phrases:
    [string, string][] = [
      ['در حال ', ''],
      ['شمارش دقیق', 'accurate count'],
      ['شمارش لحظه‌ای', 'live counting'],
      ['مدل دقیق', 'accurate model'],
      ['مدل شمارش زنده', 'live-count model'],
      ['هوش مصنوعی', 'AI'],
      ['دوربین', 'camera'],
      ['آماده‌سازی', 'preparation'],
      ['پردازش', 'processing'],
      ['نتیجه', 'result'],
      ['تصویر', 'image'],
      ['خطا', 'error'],
      ['ناموفق بود', 'failed'],
      ['ناموفق', 'failed'],
      ['آماده است', 'is ready'],
      ['آماده شد', 'is ready'],
      ['ذخیره شد', 'was saved'],
      ['در دسترس نیست', 'is unavailable'],
      ['بررسی کنید', 'check'],
      ['لطفاً', 'please'],
      ['رشته', 'threads'],
      ['پیکسل', 'pixels'],
      ['قرص', 'pills'],
      ['ثانیه', 'seconds'],
      ['دقیقه', 'minutes'],
      ['مگابایت', 'MB'],
      ['فعال شد', 'enabled'],
    ]

  if (/[\u0600-\u06ff]/.test(value)) {
    for (const [
      source,
      target,
    ] of phrases) {
      value = value.replaceAll(
        source,
        target,
      )
    }
  }

  return value
}

function storeOriginalAttribute(
  element: Element,
  name: string,
  value: string,
): void {
  const stored =
    originalAttributes.get(
      element,
    ) ??
    new Map<string, string>()

  if (!stored.has(name)) {
    stored.set(name, value)
    originalAttributes.set(
      element,
      stored,
    )
  }
}

function applyToTextNode(
  node: Text,
): void {
  const parent =
    node.parentElement

  if (
    !parent ||
    parent.closest(
      'script, style, code, pre, [data-beshmarai-i18n-ignore]',
    )
  ) {
    return
  }

  if (!originalText.has(node)) {
    originalText.set(
      node,
      node.data,
    )
  }

  const original =
    originalText.get(node) ??
    node.data

  const nextValue =
    activeLanguage === 'fa'
      ? original
      : translateDynamic(
          original,
        )

  if (node.data !== nextValue) {
    lastAppliedText.set(
      node,
      nextValue,
    )

    node.data = nextValue
  }
}

function applyToElement(
  element: Element,
): void {
  if (
    element.matches(
      'script, style, code, pre, [data-beshmarai-i18n-ignore]',
    )
  ) {
    return
  }

  for (const name of attributeNames) {
    const current =
      element.getAttribute(
        name,
      )

    if (current === null) {
      continue
    }

    storeOriginalAttribute(
      element,
      name,
      current,
    )

    const original =
      originalAttributes
        .get(element)
        ?.get(name) ??
      current

    const nextValue =
      activeLanguage === 'fa'
        ? original
        : translateDynamic(
            original,
          )

    if (current !== nextValue) {
      const applied =
        lastAppliedAttributes.get(
          element,
        ) ??
        new Map<string, string>()

      applied.set(
        name,
        nextValue,
      )

      lastAppliedAttributes.set(
        element,
        applied,
      )

      element.setAttribute(
        name,
        nextValue,
      )
    }
  }

  if (element.hasAttribute('dir')) {
    storeOriginalAttribute(
      element,
      'dir',
      element.getAttribute(
        'dir',
      ) ?? '',
    )

    const nextDirection =
      activeLanguage === 'fa'
        ? 'rtl'
        : 'ltr'

    if (
      element.getAttribute('dir') !==
      nextDirection
    ) {
      const applied =
        lastAppliedAttributes.get(
          element,
        ) ??
        new Map<string, string>()

      applied.set(
        'dir',
        nextDirection,
      )

      lastAppliedAttributes.set(
        element,
        applied,
      )

      element.setAttribute(
        'dir',
        nextDirection,
      )
    }
  }
}

function translateTree(
  root: Node,
): void {
  if (root instanceof Text) {
    applyToTextNode(root)
    return
  }

  if (!(root instanceof Element)) {
    return
  }

  applyToElement(root)

  const walker =
    document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT |
        NodeFilter.SHOW_TEXT,
    )

  let current =
    walker.nextNode()

  while (current) {
    if (current instanceof Text) {
      applyToTextNode(current)
    } else if (
      current instanceof Element
    ) {
      applyToElement(current)
    }

    current =
      walker.nextNode()
  }
}

function setDocumentLanguage(
  language: AppLanguage,
): void {
  activeLanguage =
    language

  document.documentElement.lang =
    language

  document.documentElement.dir =
    language === 'fa'
      ? 'rtl'
      : 'ltr'

  document.documentElement.dataset
    .beshmaraiLanguage =
    language

  try {
    window.localStorage.setItem(
      languageStorageKey,
      language,
    )
  } catch {
    // Language persistence is best effort.
  }

  internalMutation = true

  try {
    translateTree(
      document.body,
    )
  } finally {
    internalMutation = false
  }

  window.dispatchEvent(
    new CustomEvent(
      'beshmarai-language-changed',
      {
        detail: {
          language,
        },
      },
    ),
  )
}

function createLanguageSwitcher():
  HTMLElement {
  const container =
    document.createElement(
      'div',
    )

  container.id =
    'beshmarai-language-switcher'

  container.setAttribute(
    'data-beshmarai-i18n-ignore',
    'true',
  )

  container.setAttribute(
    'role',
    'group',
  )

  container.setAttribute(
    'aria-label',
    'Language',
  )

  const english =
    document.createElement(
      'button',
    )

  english.type = 'button'
  english.textContent =
    'English'

  const persian =
    document.createElement(
      'button',
    )

  persian.type = 'button'
  persian.textContent =
    'فارسی'

  const updateActiveState =
    () => {
      english.classList.toggle(
        'active',
        activeLanguage ===
          'en',
      )

      persian.classList.toggle(
        'active',
        activeLanguage ===
          'fa',
      )

      english.setAttribute(
        'aria-pressed',
        String(
          activeLanguage ===
            'en',
        ),
      )

      persian.setAttribute(
        'aria-pressed',
        String(
          activeLanguage ===
            'fa',
        ),
      )
    }

  english.addEventListener(
    'click',
    () => {
      setDocumentLanguage(
        'en',
      )

      updateActiveState()
    },
  )

  persian.addEventListener(
    'click',
    () => {
      setDocumentLanguage(
        'fa',
      )

      updateActiveState()
    },
  )

  container.append(
    english,
    persian,
  )

  updateActiveState()

  return container
}

function installStyles(): void {
  if (
    document.getElementById(
      'beshmarai-language-styles',
    )
  ) {
    return
  }

  const style =
    document.createElement(
      'style',
    )

  style.id =
    'beshmarai-language-styles'

  style.textContent = `
    #beshmarai-language-switcher {
      position: fixed;
      z-index: 100000;
      top: max(10px, env(safe-area-inset-top));
      right: max(10px, env(safe-area-inset-right));
      display: inline-flex;
      align-items: center;
      gap: 2px;
      padding: 3px;
      border: 1px solid rgba(111, 232, 224, 0.38);
      border-radius: 999px;
      background: rgba(1, 13, 17, 0.9);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.32);
      backdrop-filter: blur(14px);
    }

    #beshmarai-language-switcher button {
      min-height: 32px;
      padding: 5px 11px;
      border: 0;
      border-radius: 999px;
      background: transparent;
      color: #a9c8cb;
      font: 700 12px/1.2 system-ui, sans-serif;
      cursor: pointer;
    }

    #beshmarai-language-switcher button.active {
      background: linear-gradient(135deg, #23d5ca, #77efe8);
      color: #021012;
    }

    html[data-beshmarai-language='fa']
      #beshmarai-language-switcher {
      right: auto;
      left: max(10px, env(safe-area-inset-left));
    }

    html[data-beshmarai-language='en'] body,
    html[data-beshmarai-language='en'] .app-shell,
    html[data-beshmarai-language='en'] .settings-shell,
    html[data-beshmarai-language='en'] .camera-screen {
      direction: ltr !important;
      text-align: left;
    }

    html[data-beshmarai-language='en'] .button-arrow {
      transform: scaleX(-1);
    }

    @media (max-width: 680px) {
      #beshmarai-language-switcher {
        top: max(6px, env(safe-area-inset-top));
        right: max(6px, env(safe-area-inset-right));
      }

      html[data-beshmarai-language='fa']
        #beshmarai-language-switcher {
        left: max(6px, env(safe-area-inset-left));
      }
    }
  `

  document.head.append(
    style,
  )
}

export function initializeAppI18n():
  void {
  try {
    const stored =
      window.localStorage.getItem(
        languageStorageKey,
      )

    activeLanguage =
      stored === 'fa'
        ? 'fa'
        : 'en'
  } catch {
    activeLanguage = 'en'
  }

  installStyles()

  const switcher =
    createLanguageSwitcher()

  document.body.append(
    switcher,
  )

  const observer =
    new MutationObserver(
      (records) => {
        if (internalMutation) {
          return
        }

        internalMutation = true

        try {
          for (const record of records) {
            for (
              const node of
              Array.from(
                record.addedNodes,
              )
            ) {
              translateTree(node)
            }

            if (
              record.type ===
                'characterData' &&
              record.target instanceof
                Text
            ) {
              const appliedValue =
                lastAppliedText.get(
                  record.target,
                )

              if (
                appliedValue ===
                record.target.data
              ) {
                lastAppliedText.delete(
                  record.target,
                )
              } else {
                originalText.set(
                  record.target,
                  record.target.data,
                )

                applyToTextNode(
                  record.target,
                )
              }
            }

            if (
              record.type ===
                'attributes' &&
              record.target instanceof
                Element &&
              record.attributeName
            ) {
              const name =
                record.attributeName

              const current =
                record.target.getAttribute(
                  name,
                ) ?? ''

              const applied =
                lastAppliedAttributes
                  .get(record.target)
                  ?.get(name)

              if (applied === current) {
                lastAppliedAttributes
                  .get(record.target)
                  ?.delete(name)
              } else {
                const stored =
                  originalAttributes.get(
                    record.target,
                  ) ??
                  new Map<string, string>()

                stored.set(name, current)
                originalAttributes.set(
                  record.target,
                  stored,
                )

                applyToElement(
                  record.target,
                )
              }
            }
          }
        } finally {
          internalMutation = false
        }
      },
    )

  observer.observe(
    document.body,
    {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [
        ...attributeNames,
        'dir',
      ],
    },
  )

  setDocumentLanguage(
    activeLanguage,
  )
}
