import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

function normalizeBasePath(rawPath: string): string {
  const trimmed = rawPath.trim()
  if (trimmed.length === 0) {
    return '/'
  }

  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

export default defineConfig(() => {
  const basePath = normalizeBasePath(process.env.VITE_BASE_PATH ?? '/')

  return {
    base: basePath,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
        workbox: {
          maximumFileSizeToCacheInBytes: 25 * 1024 * 1024,
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.mode === 'navigate',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'kuupeli-pages',
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 24 * 60 * 60
                }
              }
            },
            {
              urlPattern: ({ url }) => url.pathname.includes('/assets/') || url.pathname.includes('/icons/'),
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'kuupeli-assets',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 30 * 24 * 60 * 60
                }
              }
            }
          ]
        },
        manifest: {
          name: 'Kuupeli',
          short_name: 'Kuupeli',
          description: 'Gamified Finnish dictation learning app',
          display: 'standalone',
          start_url: basePath,
          scope: basePath,
          theme_color: '#0b2e4f',
          background_color: '#f8f6f1',
          icons: [
            {
              src: `${basePath}icons/icon-192.png`,
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: `${basePath}icons/icon-512.png`,
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    test: {
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
      exclude: ['tests/e2e/**']
    }
  }
})
