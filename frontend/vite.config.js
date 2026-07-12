import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png', 'offline.html'],
      manifest: {
        name: 'CitizenLex – AI Legal Rights Assistant',
        short_name: 'CitizenLex',
        description: 'AI-Powered Legal Research & Citizen Rights Assistant for Indian citizens. Know your rights in English & Tamil.',
        theme_color: '#1e3a8a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        lang: 'en',
        categories: ['legal', 'government', 'productivity'],
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        shortcuts: [
          {
            name: 'AI Chat',
            short_name: 'Chat',
            url: '/chat',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }]
          },
          {
            name: 'Rights Explorer',
            short_name: 'Rights',
            url: '/rights',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff}'],
        // Skip waiting and claim clients immediately so new SW activates right away
        skipWaiting: true,
        clientsClaim: true,
        // Remove caches from old service worker versions to prevent stale JS chunk errors
        cleanupOutdatedCaches: true,
        // Use index.html as SPA fallback for navigation only (not for assets)
        navigateFallback: '/index.html',
        // CRITICAL: Deny SW interception for assets, api, and SW-related paths
        // This prevents old SW from serving stale/wrong MIME type for JS chunks
        navigateFallbackDenylist: [
          /^\/api/,
          /^\/assets\//,
          /^\/icons\//,
          /^\/registerSW\.js/,
          /^\/manifest\.webmanifest/,
          /\.js$/,
          /\.css$/,
          /\.woff2?$/,
          /^\/__/,
        ],
        runtimeCaching: [
          {
            // Network-first for API calls — always try network, fallback to cache
            urlPattern: /^https:\/\/ai-powered-citizenlex-production\.up\.railway\.app\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    // Ensure assets are in predictable paths
    assetsDir: 'assets',
    // Increase chunk size warning threshold to 1MB
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Manual chunking to keep chunks stable and avoid circular dependencies
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // React ecosystem — must be isolated to avoid circular refs
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/react-router') || id.includes('/react-router-dom/')) {
              return 'vendor-react';
            }
            // Three.js and its React bindings in a separate chunk (heaviest dependency ~845KB)
            if (id.includes('/three/') || id.includes('@react-three') || id.includes('/gsap/')) {
              return 'vendor-three';
            }
            // HTTP, socket, and utility libraries
            if (id.includes('/axios/') || id.includes('/stomp') || id.includes('/sockjs')) {
              return 'vendor-http';
            }
            // Let Rollup handle the rest automatically — avoids circular dependency warnings
          }
        }
      }
    }
  }
});

