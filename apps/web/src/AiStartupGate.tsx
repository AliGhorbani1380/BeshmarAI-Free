// BESHMARAI_FINAL_RUNTIME_CLEAN_ROOM_STARTUP_GATE_V3_1_2
// BESHMARAI_PREVIEW_STARTUP_NON_BLOCKING_V1
// BESHMARAI_POST_TERMS_DUAL_MODEL_GATE_V1
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  loadPreviewModelSession,
} from './ml/iosPreviewModel'
import {
  prepareAiModels,
  prepareFinalModelForOfflineUse,
  type AiDownloadProgress,
  type AiPersistentModelProgress,
} from './aiModelCache'
import {
  ensureDeviceStrategyOnce,
} from './finalRuntime'
import './aiStartup.css'

type AiStartupGateProps = {
  children: ReactNode
}

const previewStartupRuntimeMarker =
  'BESHMARAI_PREVIEW_STARTUP_RUNTIME_V1'

const finalStartupRuntimeMarker =
  'BESHMARAI_FINAL_STARTUP_NON_BLOCKING_RUNTIME_V1'

type PreparationStage =
  | 'preview'
  | 'final'
  | 'strategy'
  | 'finishing'
  | 'ready'

function schedulePreviewSessionPreparation():
  void {
  window.setTimeout(
    () => {
      void loadPreviewModelSession()
        .then(
          () => {
            console.info(
              'BESHMARAI_PREVIEW_BACKGROUND_READY',
              {
                preview_startup_runtime_marker:
                  previewStartupRuntimeMarker,
              },
            )
          },
        )
        .catch(
          (error: unknown) => {
            console.warn(
              'BESHMARAI_PREVIEW_BACKGROUND_PREPARE_FAILED',
              {
                preview_startup_runtime_marker:
                  previewStartupRuntimeMarker,
                error,
              },
            )
          },
        )
    },
    750,
  )
}

const finalMessages = [
  'مدل شمارش دقیق در حال دانلود است؛ لطفاً این صفحه را نبندید.',
  'مدل دقیق حدود ۸۰ مگابایت است و مستقیماً روی دستگاه آماده می‌شود.',
  'تصاویر شما برای شمارش به سرور ارسال نمی‌شوند.',
  'پس از پایان، استراتژی مناسب این دستگاه ذخیره و در دفعات بعد مستقیماً استفاده می‌شود.',
  'سرعت آماده‌سازی به اینترنت و توان پردازشی گوشی بستگی دارد.',
  'در حال انتخاب بهترین موتور شمارش برای سخت‌افزار این دستگاه...',
] as const

function formatElapsed(
  seconds: number,
): string {
  const minutes =
    Math.floor(
      seconds / 60,
    )

  const remainder =
    seconds % 60

  if (minutes <= 0) {
    return `${remainder.toLocaleString('fa-IR')} ثانیه`
  }

  return (
    `${minutes.toLocaleString('fa-IR')} دقیقه و ` +
    `${remainder.toLocaleString('fa-IR')} ثانیه`
  )
}

export function AiStartupGate({
  children,
}: AiStartupGateProps) {
  const [ready, setReady] =
    useState(false)

  const [stage, setStage] =
    useState<PreparationStage>(
      'preview',
    )

  const [progress, setProgress] =
    useState(4)

  const [elapsedSeconds, setElapsedSeconds] =
    useState(0)

  const [error, setError] =
    useState<string | null>(
      null,
    )

  const [attempt, setAttempt] =
    useState(0)

  const [storageMessage, setStorageMessage] =
    useState(
      'در حال بررسی حافظه داخلی...',
    )

  useEffect(() => {
    if (ready) {
      return
    }

    const timer =
      window.setInterval(
        () => {
          setElapsedSeconds(
            (value) =>
              value + 1,
          )
        },
        1000,
      )

    return () => {
      window.clearInterval(
        timer,
      )
    }
  }, [
    ready,
    stage,
  ])

  useEffect(() => {
    let active = true

    setReady(false)
    setError(null)
    setStage('preview')
    setProgress(4)
    setElapsedSeconds(0)
    setStorageMessage(
      'در حال بررسی حافظه داخلی...',
    )

    void (async () => {
      setStorageMessage(
        'در حال بررسی مدل عمومی شمارش زنده...',
      )

      await prepareAiModels(
        (
          previewProgress:
            AiDownloadProgress,
        ) => {
          if (!active) {
            return
          }

          setStorageMessage(
            previewProgress.fromCache
              ? 'مدل شمارش زنده از حافظه دستگاه آماده شد.'
              : `در حال دانلود ${previewProgress.currentLabel}...`,
          )

          setProgress(
            4 +
              Math.round(
                previewProgress.percent *
                  0.16,
              ),
          )
        },
      )

      if (!active) {
        return
      }

      setProgress(20)
      setStage('final')
      setStorageMessage(
        'در حال بررسی قطعه‌های ذخیره‌شده مدل دقیق...',
      )

      await prepareFinalModelForOfflineUse(
        (
          modelProgress:
            AiPersistentModelProgress,
        ) => {
          if (!active) {
            return
          }

          setStorageMessage(
            modelProgress.message,
          )

          setProgress(
            20 +
              Math.round(
                modelProgress.percent *
                  0.72,
              ),
          )
        },
      )

      setStage('strategy')
      setProgress(93)
      setStorageMessage(
        'در حال تنظیم یک‌باره این دستگاه برای سریع‌ترین شمارش...',
      )

      await ensureDeviceStrategyOnce(
        (strategyProgress) => {
          if (!active) {
            return
          }

          setStorageMessage(
            strategyProgress.message,
          )

          setProgress(
            93 +
              Math.round(
                strategyProgress.percent *
                  0.04,
              ),
          )
        },
      )

      // Final session construction is background work after the app opens.
      // Strategy selection and Preview warm-up have already completed once.
      if (!active) {
        return
      }

      setStorageMessage(
        'مدل‌ها آماده‌اند؛ در حال بازکردن برنامه...',
      )
      setStage('finishing')
      setProgress(98)

      await new Promise<void>(
        (resolve) => {
          window.setTimeout(
            resolve,
            500,
          )
        },
      )

      if (!active) {
        return
      }

      setStage('ready')
      setProgress(100)

      await new Promise<void>(
        (resolve) => {
          window.setTimeout(
            resolve,
            350,
          )
        },
      )

      if (active) {
        setReady(true)

        console.info(
          'BESHMARAI_FINAL_STARTUP_GATE_OPEN',
          {
            final_startup_runtime_marker:
              finalStartupRuntimeMarker,
            automatic_final_prewarm:
              false,
          },
        )

        // Preview may prepare in the background after the application opens.
        // Final runtime is created only for an explicit accurate-count request.
        schedulePreviewSessionPreparation()
      }
    })().catch(
      (caught: unknown) => {
        if (!active) {
          return
        }

        const detail =
          caught instanceof Error
            ? caught.message
            : String(caught)

        console.error(
          'BESHMARAI_DUAL_MODEL_STARTUP_FAILED',
          caught,
        )

        setError(detail)
      },
    )

    return () => {
      active = false
    }
  }, [attempt])

  const retry =
    useCallback(() => {
      setAttempt(
        (value) =>
          value + 1,
      )
    }, [])

  const rotatingMessage =
    useMemo(
      () =>
        finalMessages[
          Math.floor(
            elapsedSeconds / 5,
          ) %
            finalMessages.length
        ],
      [elapsedSeconds],
    )

  if (ready) {
    return <>{children}</>
  }

  const title =
    stage === 'preview'
      ? 'در حال آماده‌سازی شمارش زنده'
      : stage === 'final'
        ? 'در حال دانلود هوش مصنوعی دقیق'
        : stage === 'strategy'
          ? 'تنظیم یک‌باره برای این دستگاه'
        : 'در حال تکمیل راه‌اندازی'

  const currentLabel =
    stage === 'preview'
      ? storageMessage
      : stage === 'final'
        ? storageMessage
        : 'هر دو مدل روی دستگاه آماده‌اند؛ در حال ورود به برنامه...'

  return (
    <main
      className="ai-startup-screen"
      dir="rtl"
      aria-busy={!error}
    >
      <div
        className="ai-startup-backdrop"
        aria-hidden="true"
      />

      <section
        className="ai-startup-card"
        role="status"
        aria-live="polite"
      >
        <img
          className="ai-startup-logo"
          src={`${import.meta.env.BASE_URL}assets/qorshshomar-logo.png`}
          alt="قرص‌شمار BeshmarAI"
        />

        <div
          className="ai-startup-orbit"
          aria-hidden="true"
        >
          <span />
          <span />
          <span />
        </div>

        <header>
          <strong>
            {title}
          </strong>

          <span>
            لطفاً چند لحظه صبر کنید
          </span>
        </header>

        {!error && (
          <>
            <div
              className="ai-startup-progress"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={
                Math.round(
                  progress,
                )
              }
              aria-label="پیشرفت تقریبی آماده‌سازی"
            >
              <span
                style={{
                  width:
                    `${progress}%`,
                }}
              />
            </div>

            <div className="ai-startup-details">
              <strong>
                {Math.round(
                  progress,
                ).toLocaleString(
                  'fa-IR',
                )}
                ٪
              </strong>

              <span>
                {currentLabel}
              </span>

              <small>
                زمان سپری‌شده:
                {' '}
                {formatElapsed(
                  elapsedSeconds,
                )}
              </small>
            </div>

            <p>
              {stage === 'final'
                ? rotatingMessage
                : 'برنامه فقط پس از آماده‌شدن واقعی فایل‌های مدل وارد منوی اصلی می‌شود.'}
            </p>

            <p>
              مدل دقیق فقط یک‌بار روی حافظه داخلی ذخیره می‌شود؛ دفعات بعد بدون دانلود از همان نسخه استفاده خواهد شد.
            </p>
          </>
        )}

        {error && (
          <div
            className="ai-startup-error"
            role="alert"
          >
            <strong>
              آماده‌سازی کامل نشد
            </strong>

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={retry}
            >
              تلاش دوباره
            </button>
          </div>
        )}
      </section>
    </main>
  )
}
