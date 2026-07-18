import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import * as path from 'path'

// Отдельный конфиг тестов (без auto-import/i18n-плагинов — в тестах импорты явные).
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist', 'e2e'],
  },
})
