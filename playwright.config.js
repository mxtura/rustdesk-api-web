import { defineConfig } from '@playwright/test'

// e2e против запущенного экземпляра: BASE_URL=... npm run test:e2e
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: {
    baseURL: process.env.BASE_URL || 'https://193.33.124.73:9443',
    ignoreHTTPSErrors: true, // самоподписанный серт
    headless: true,
  },
})
