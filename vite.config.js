import { defineConfig, loadEnv } from 'vite'
import * as path from 'path'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: './', // раздаётся из подкаталога/корня — относительные пути
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      open: true,
      port: Number(env.VITE_DEV_PORT) || 5173,
      proxy: {
        [env.VITE_SERVER_API || '/api']: {
          target: env.VITE_SERVER_PATH,
          changeOrigin: true,
          secure: false, // бэкенд с самоподписанным сертом
        },
      },
    },
    build: {
      target: 'es2020',
      minify: 'esbuild',
      sourcemap: false,
      emptyOutDir: true,
      outDir: 'dist',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              const pkg = id.toString().split('node_modules/')[1].split('/')[0]
              switch (pkg) {
                case '@popperjs':
                case '@vue':
                case 'axios':
                case 'element-plus':
                case '@element-plus':
                  return '_' + pkg
                default:
                  return '__vendor'
              }
            }
          },
          chunkFileNames: 'static/chunk/[name]-[hash].js',
          entryFileNames: 'static/entry/[name]-[hash].js',
          assetFileNames: 'static/[ext]/[name]-[hash].[ext]',
        },
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          javascriptEnabled: true,
        },
      },
    },
    plugins: [
      vue(),
      // прекомпиляция локалей vue-i18n (runtimeOnly — без компилятора сообщений в проде)
      VueI18nPlugin({
        include: [path.resolve(__dirname, './src/utils/i18n/**')],
        runtimeOnly: false,
      }),
      // авто-импорт композиционных API (Vue/Router/Pinia/VueUse) — меньше boilerplate
      AutoImport({
        imports: ['vue', 'vue-router', 'pinia', '@vueuse/core'],
        dts: 'src/auto-imports.d.ts',
        eslintrc: { enabled: false },
      }),
      // авто-регистрация локальных компонентов из src/components (Element Plus остаётся глобальным)
      Components({
        dirs: ['src/components'],
        dts: 'src/components.d.ts',
      }),
    ],
  }
})
