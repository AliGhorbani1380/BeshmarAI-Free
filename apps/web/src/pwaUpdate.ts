/// <reference types="vite-plugin-pwa/client" />

import {
  registerSW,
} from 'virtual:pwa-register'

// BESHMARAI_IOS_PWA_UPDATE_MANAGEMENT_V1_1

declare global {
  interface Window {
    __BESHMARAI_PWA_INITIALIZED__?:
      boolean
  }
}

const updateCheckIntervalMs =
  30 * 60 * 1000

const updateBannerId =
  'beshmarai-pwa-update-banner'

const updateStyleId =
  'beshmarai-pwa-update-style'

const offlineToastId =
  'beshmarai-pwa-offline-toast'

function installPwaStyles(): void {
  if (
    document.getElementById(
      updateStyleId,
    )
  ) {
    return
  }

  const style =
    document.createElement('style')

  style.id = updateStyleId

  style.textContent = `
    #${updateBannerId} {
      position: fixed;
      z-index: 100000;
      right:
        max(
          14px,
          env(safe-area-inset-right)
        );
      left:
        max(
          14px,
          env(safe-area-inset-left)
        );
      bottom:
        max(
          14px,
          calc(
            env(safe-area-inset-bottom) +
            10px
          )
        );
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      padding: 14px 16px;
      border:
        1px solid
        rgba(44, 235, 235, 0.36);
      border-radius: 18px;
      direction: rtl;
      color: #efffff;
      background:
        linear-gradient(
          145deg,
          rgba(5, 28, 32, 0.98),
          rgba(2, 12, 16, 0.98)
        );
      box-shadow:
        0 18px 50px
        rgba(0, 0, 0, 0.44);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter:
        blur(20px);
      font-family: inherit;
    }

    #${updateBannerId}
    .beshmarai-update-content {
      min-width: 0;
      display: grid;
      gap: 4px;
    }

    #${updateBannerId}
    .beshmarai-update-title {
      color: #baffff;
      font-size: 14px;
      font-weight: 900;
    }

    #${updateBannerId}
    .beshmarai-update-description {
      color:
        rgba(
          235,
          255,
          255,
          0.72
        );
      font-size: 12px;
      line-height: 1.7;
    }

    #${updateBannerId}
    .beshmarai-update-button {
      flex: 0 0 auto;
      min-width: 105px;
      min-height: 44px;
      padding: 9px 16px;
      border:
        1px solid
        rgba(155, 255, 255, 0.72);
      border-radius: 14px;
      cursor: pointer;
      color: #001d20;
      background:
        linear-gradient(
          135deg,
          #b8ffff,
          #00dbe7
        );
      font-family: inherit;
      font-size: 13px;
      font-weight: 900;
    }

    #${updateBannerId}
    .beshmarai-update-button:disabled {
      cursor: wait;
      opacity: 0.7;
    }

    #${offlineToastId} {
      position: fixed;
      z-index: 99999;
      right: 50%;
      bottom:
        max(
          18px,
          calc(
            env(safe-area-inset-bottom) +
            14px
          )
        );
      max-width:
        min(
          88vw,
          420px
        );
      padding: 11px 16px;
      border:
        1px solid
        rgba(80, 235, 235, 0.3);
      border-radius: 15px;
      direction: rtl;
      transform:
        translateX(50%);
      color: #eaffff;
      background:
        rgba(2, 22, 26, 0.97);
      box-shadow:
        0 14px 40px
        rgba(0, 0, 0, 0.38);
      font-family: inherit;
      font-size: 12px;
      line-height: 1.7;
      text-align: center;
    }

    @media (max-width: 420px) {
      #${updateBannerId} {
        align-items: stretch;
        flex-direction: column;
      }

      #${updateBannerId}
      .beshmarai-update-button {
        width: 100%;
      }
    }
  `

  document.head.appendChild(style)
}

function showOfflineToast(): void {
  installPwaStyles()

  document
    .getElementById(
      offlineToastId,
    )
    ?.remove()

  const toast =
    document.createElement('div')

  toast.id = offlineToastId

  toast.textContent =
    'برنامه و مدل شمارش برای استفاده آفلاین آماده شدند.'

  document.body.appendChild(toast)

  window.setTimeout(() => {
    toast.remove()
  }, 4200)
}

function showUpdateBanner(
  applyUpdate:
    () => Promise<void>,
): void {
  installPwaStyles()

  if (
    document.getElementById(
      updateBannerId,
    )
  ) {
    return
  }

  const banner =
    document.createElement('div')

  banner.id = updateBannerId

  const content =
    document.createElement('div')

  content.className =
    'beshmarai-update-content'

  const title =
    document.createElement('strong')

  title.className =
    'beshmarai-update-title'

  title.textContent =
    'نسخه جدید آماده است'

  const description =
    document.createElement('span')

  description.className =
    'beshmarai-update-description'

  description.textContent =
    'برای دریافت آخرین بهبودها، برنامه را به‌روزرسانی کنید.'

  const button =
    document.createElement('button')

  button.className =
    'beshmarai-update-button'

  button.type = 'button'

  button.textContent =
    'به‌روزرسانی'

  button.addEventListener(
    'click',
    () => {
      button.disabled = true

      button.textContent =
        'در حال نصب...'

      void applyUpdate()
        .catch((error: unknown) => {
          console.error(
            'BESHMARAI_PWA_UPDATE_FAILED',
            error,
          )

          button.disabled = false

          button.textContent =
            'تلاش دوباره'
        })
    },
  )

  content.append(
    title,
    description,
  )

  banner.append(
    content,
    button,
  )

  document.body.appendChild(banner)

  console.info(
    'BESHMARAI_PWA_UPDATE_PROMPT_VISIBLE',
  )
}

async function cleanupDevelopmentPwa():
  Promise<void> {
  if (
    !(
      'serviceWorker' in
      navigator
    )
  ) {
    return
  }

  const registrations =
    await navigator
      .serviceWorker
      .getRegistrations()

  await Promise.all(
    registrations.map(
      async (registration) => {
        await registration.unregister()
      },
    ),
  )

  if ('caches' in window) {
    const cacheNames =
      await caches.keys()

    await Promise.all(
      cacheNames.map(
        async (cacheName) => {
          const lowerName =
            cacheName.toLowerCase()

          if (
            lowerName.includes(
              'workbox',
            ) ||
            lowerName.includes(
              'precache',
            ) ||
            lowerName.includes(
              'vite-pwa',
            )
          ) {
            await caches.delete(
              cacheName,
            )
          }
        },
      ),
    )
  }

  console.info(
    'BESHMARAI_DEV_PWA_CACHE_CLEANED',
    {
      registrationCount:
        registrations.length,
    },
  )
}

export function
initializeBeshmarAIPwa(): void {
  if (
    window
      .__BESHMARAI_PWA_INITIALIZED__
  ) {
    return
  }

  window
    .__BESHMARAI_PWA_INITIALIZED__ =
      true

  if (import.meta.env.DEV) {
    void cleanupDevelopmentPwa()

    return
  }

  if (
    !(
      'serviceWorker' in
      navigator
    )
  ) {
    console.info(
      'BESHMARAI_PWA_UNSUPPORTED',
    )

    return
  }

  let registration:
    ServiceWorkerRegistration |
    undefined

  let updateSW:
    ReturnType<typeof registerSW> |
    undefined

  const requestUpdateCheck = () => {
    if (
      document.visibilityState !==
        'visible' ||
      !navigator.onLine ||
      !registration
    ) {
      return
    }

    void registration
      .update()
      .catch((error: unknown) => {
        console.warn(
          'BESHMARAI_PWA_UPDATE_CHECK_FAILED',
          error,
        )
      })
  }

  updateSW = registerSW({
    immediate: true,

    onNeedRefresh() {
      console.info(
        'BESHMARAI_PWA_UPDATE_READY',
      )

      showUpdateBanner(
        async () => {
          if (!updateSW) {
            throw new Error(
              'PWA_UPDATE_HANDLER_NOT_READY',
            )
          }

          await updateSW(true)
        },
      )
    },

    onOfflineReady() {
      console.info(
        'BESHMARAI_PWA_OFFLINE_READY',
      )

      showOfflineToast()
    },

    onRegisteredSW(
      serviceWorkerUrl,
      currentRegistration,
    ) {
      registration =
        currentRegistration

      console.info(
        'BESHMARAI_PWA_REGISTERED',
        {
          serviceWorkerUrl,

          hasRegistration:
            Boolean(
              currentRegistration,
            ),
        },
      )

      window.setInterval(
        requestUpdateCheck,
        updateCheckIntervalMs,
      )
    },

    onRegisterError(error) {
      console.error(
        'BESHMARAI_PWA_REGISTER_ERROR',
        error,
      )
    },
  })

  window.addEventListener(
    'focus',
    requestUpdateCheck,
  )

  window.addEventListener(
    'online',
    requestUpdateCheck,
  )

  document.addEventListener(
    'visibilitychange',
    () => {
      if (
        document.visibilityState ===
        'visible'
      ) {
        requestUpdateCheck()
      }
    },
  )

  console.info(
    'BESHMARAI_IOS_PWA_UPDATE_MANAGEMENT_READY',
  )
}