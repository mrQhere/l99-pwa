import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'L99 — Ophthalmic Diagnostic System',
        short_name: 'L99',
        description: 'AI-powered retinal screening for diabetic retinopathy',
        theme_color: '#0a0a0f',
        background_color: '#0a0a0f',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,wasm,mjs}'],
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.endsWith('.onnx') || url.pathname.endsWith('.wasm') || url.pathname.endsWith('.mjs'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'onnx-assets',
              expiration: { maxEntries: 20, maxAgeSeconds: 30 * 24 * 60 * 60 }
            }
          },
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'jsdelivr-cdn',
              expiration: { maxEntries: 10, maxAgeSeconds: 30 * 24 * 60 * 60 }
            }
          }
        ]
      }
    })
  ],
  build: {
    target: 'es2020',
    sourcemap: false
  },
  optimizeDeps: {
    exclude: ['onnxruntime-web']
  }
});
