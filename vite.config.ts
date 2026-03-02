import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      workbox: {
        maximumFileSizeToCacheInBytes: 25 * 1024 * 1024
      },
      manifest: {
        name: 'Kuupeli',
        short_name: 'Kuupeli',
        description: 'Gamified Finnish dictation learning app',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        theme_color: '#0b2e4f',
        background_color: '#f8f6f1',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512.png',
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
})
