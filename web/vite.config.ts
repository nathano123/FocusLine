import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Proxy /ingest to PostHog EU in local dev so behavior matches production
  // (where vercel.json does the same). Defeats ad blockers because requests
  // appear same-origin in the network tab.
  server: {
    proxy: {
      '/ingest/static': {
        target: 'https://eu-assets.i.posthog.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ingest\/static/, '/static'),
        secure: true,
      },
      '/ingest': {
        target: 'https://eu.i.posthog.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ingest/, ''),
        secure: true,
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'FocusLine',
        short_name: 'FocusLine',
        description: 'A focus timer you don’t have to look at. A thin line at the edge of your screen quietly tracks the session.',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'any',
        start_url: '/app',
        scope: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          {
            name: '25-minute focus',
            short_name: '25 min',
            description: 'Start a 25-minute focus block',
            url: '/app?start=25',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }],
          },
          {
            name: '50-minute focus',
            short_name: '50 min',
            description: 'Start a 50-minute focus block',
            url: '/app?start=50',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Pomodoro cycle',
            short_name: 'Pomodoro',
            description: 'Start a full Pomodoro cycle',
            url: '/app?start=pomodoro',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
})
