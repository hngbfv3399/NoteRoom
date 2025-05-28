import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'
  const isProd = mode === 'production'
  // Vite 빌드 시 환경변수는 런타임에 접근할 수 없으므로 조건부로 처리
  const shouldAnalyze = false // 필요시 수동으로 true로 변경

  return {
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
      }),
      // 번들 분석기 (빌드 시에만 활성화)
      shouldAnalyze && visualizer({
        filename: 'dist/bundle-analysis.html',
        open: true,
        gzipSize: true,
        brotliSize: true
      })
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      sourcemap: isDev,
      minify: 'terser',
      chunkSizeWarningLimit: 1000,
      terserOptions: {
        compress: {
          drop_console: isProd,
          drop_debugger: isProd
        },
      },
      rollupOptions: {
        output: {
          sourcemap: false,
          entryFileNames: 'js/[name]-[hash].js',
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop().replace('.jsx', '').replace('.js', '') : 'chunk';
            return `js/${facadeModuleId}-[hash].js`;
          },
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/\.(css)$/.test(assetInfo.name)) {
              return `css/[name]-[hash].${ext}`;
            }
            if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
              return `images/[name]-[hash].${ext}`;
            }
            return `assets/[name]-[hash].${ext}`;
          },
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
            'ui-vendor': ['framer-motion', 'react-icons'],
            'utils-vendor': ['date-fns', 'lodash'],
            'editor-vendor': [
              '@tiptap/react', 
              '@tiptap/starter-kit',
              '@tiptap/extension-color',
              '@tiptap/extension-text-style'
            ],
            'query-vendor': ['@tanstack/react-query'],
            'admin-features': [
              './src/features/admin/index.js',
              './src/features/admin/components/AdminDashboard.jsx'
            ],
            'search-features': [
              './src/features/search/index.js'
            ],
            'notes-features': [
              './src/features/notes/index.js'
            ],
            'user-features': [
              './src/features/user/index.js'
            ],
            'editor-features': [
              './src/features/editor/index.js'
            ],
            'shared-components': [
              './src/shared/components/OptimizedDataTable.jsx',
              './src/shared/components/VirtualizedList.jsx',
              './src/shared/components/LazyImage.jsx'
            ]
          }
        }
      }
    },
    server: {
      port: 3000,
      open: true,
      hmr: {
        overlay: true
      }
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'firebase/app',
        'firebase/auth',
        'firebase/firestore',
        'framer-motion'
      ],
      exclude: ['@vite/client', '@vite/env']
    },
    define: {
      __DEV__: isDev
    }
  }
})