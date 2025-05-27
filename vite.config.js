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
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // Firestore 요청은 Service Worker에서 직접 처리
        globIgnores: ['**/node_modules/**/*'],
        // 소스 맵 생성 비활성화
        sourcemap: false
      },
      workbox: {
        // 소스 맵 생성 비활성화
        sourcemap: false
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
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage']
        }
      }
    }
  }
})