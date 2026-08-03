import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import { readdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const projectRoot = fileURLToPath(
  new URL('.', import.meta.url),
)

function productionReleasePrune() {
  return {
    name: 'beshmarai-public-release-prune',
    apply: 'build' as const,
    closeBundle() {
      const distRoot =
        resolve(projectRoot, 'dist')

      const exactPaths = [
        'models/debug',
        'models/preview',
        'models/secure',
      ]

      for (
        const relativePath of
        exactPaths
      ) {
        rmSync(
          resolve(
            distRoot,
            relativePath,
          ),
          {
            recursive: true,
            force: true,
          },
        )
      }

      for (
        const entry of
        readdirSync(
          distRoot,
          {
            withFileTypes: true,
          },
        )
      ) {
        if (
          entry.name.startsWith(
            'ort-binary-wasm-',
          ) ||
          entry.name.startsWith(
            'ort-wasm-v',
          )
        ) {
          rmSync(
            resolve(
              distRoot,
              entry.name,
            ),
            {
              recursive: true,
              force: true,
            },
          )
        }
      }
    },
  }
}

export default defineConfig({
  base: '/app/',

  plugins: [
    productionReleasePrune(),
    react(),

    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeManifestIcons: false,

      manifest: {
        id: '/app/',
        name: 'BeshmarAI Pill Counter',
        short_name: 'BeshmarAI Pill Counter',
        description:
          'Free on-device AI pill counting with English and Persian interfaces',
        lang: 'en',
        dir: 'ltr',
        start_url: '/app/',
        scope: '/app/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#020609',
        background_color: '#020609',

        icons: [
          {
            src:
              '/app/assets/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src:
              '/app/assets/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src:
              '/app/assets/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },

      workbox: {
        globPatterns: [
          '**/*.{js,mjs,css,html,png,svg,gif,webp,ico,json,wasm}',
        ],
        globIgnores: [
          'models/public-v1/**',
          'ort-runtime-1.27.0/**/*.wasm',
          'assets/**/*.wasm',
        ],
        maximumFileSizeToCacheInBytes:
          20 * 1024 * 1024,
        cleanupOutdatedCaches: true,

        runtimeCaching: [
          {
            urlPattern:
              /\/app\/assets\/.+\.wasm$/,
            handler: 'CacheFirst',
            options: {
              cacheName:
                'beshmarai-vite-wasm-assets-v1',
              cacheableResponse: {
                statuses: [0, 200],
              },
              expiration: {
                maxEntries: 8,
                maxAgeSeconds:
                  365 * 24 * 60 * 60,
              },
            },
          },
          {
            urlPattern:
              /\/app\/models\/public-v1\/.+$/,
            handler: 'CacheFirst',
            options: {
              cacheName:
                'beshmarai-public-model-parts-v1',
              cacheableResponse: {
                statuses: [0, 200],
              },
              expiration: {
                maxEntries: 16,
                maxAgeSeconds:
                  365 * 24 * 60 * 60,
              },
            },
          },
          {
            urlPattern:
              /\/app\/ort-runtime-1\.27\.0\/.+\.(?:mjs|wasm|json)$/,
            handler: 'CacheFirst',
            options: {
              cacheName:
                'beshmarai-ort-runtime-1.27.0',
              cacheableResponse: {
                statuses: [0, 200],
              },
              expiration: {
                maxEntries: 8,
                maxAgeSeconds:
                  365 * 24 * 60 * 60,
              },
            },
          },
        ],
      },

      devOptions: {
        enabled: false,
      },
    }),
  ],

  build: {
    sourcemap: false,
    rollupOptions: {
      input: {
        main: fileURLToPath(
          new URL(
            './index.html',
            import.meta.url,
          ),
        ),
      },
    },
  },

  server: {
    host: true,
    port: 3000,
    strictPort: true,
    headers: {
      'Cross-Origin-Opener-Policy':
        'same-origin',
      'Cross-Origin-Embedder-Policy':
        'require-corp',
      'Cross-Origin-Resource-Policy':
        'same-origin',
    },
  },

  preview: {
    host: true,
    port: 3000,
    strictPort: true,
  },
})
