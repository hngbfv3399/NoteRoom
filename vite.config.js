import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['notes.svg', 'vite.svg'],
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.js',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        globIgnores: ['**/node_modules/**/*'],
        sourcemap: false,
        rollupFormat: 'es',
        maximumFileSizeToCacheInBytes: 3000000, // 3MB로 증가
      },
      workbox: {
        sourcemap: false,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1년
              },
              cacheKeyWillBeUsed: async ({ request }) => {
                return `${request.url}?v=1`;
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1년
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30일
              },
            },
          },
        ],
      },
      manifest: {
        name: 'NoteRoom - 감정과 생각을 기록하고 공유하는 소셜 노트 플랫폼',
        short_name: 'NoteRoom',
        description: '감정과 생각을 기록하고 공유하는 소셜 노트 플랫폼입니다.',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'notes.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: false, // 프로덕션에서 소스 맵 비활성화
    minify: 'terser',
    chunkSizeWarningLimit: 500, // 청크 크기 경고 임계값을 500KB로 설정
    terserOptions: {
      sourceMap: false,
      compress: {
        drop_console: true, // 프로덕션에서 console.log 제거
        drop_debugger: true, // 프로덕션에서 debugger 제거
      },
    },
    rollupOptions: {
      output: {
        sourcemap: false,
        // 파일명에 해시 추가로 캐싱 최적화
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: {
          // React 관련
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          
          // Firebase 관련
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          
          // UI 라이브러리
          'vendor-ui': ['@tanstack/react-query', 'react-redux', '@reduxjs/toolkit'],
          
          // TipTap 에디터 (이미 별도 청크로 분리됨)
          'vendor-editor': ['@tiptap/react', '@tiptap/starter-kit'],
          
          // 유틸리티 라이브러리
          'vendor-utils': ['dayjs', 'dompurify'],
          
          // Framer Motion
          'vendor-motion': ['framer-motion']
        }
      }
    }
  }
})