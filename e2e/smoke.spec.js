import { test, expect } from '@playwright/test'

// Дымовой тест: панель отдаётся с корня и показывает страницу входа.
test('страница входа рендерится', async ({ page }) => {
  await page.goto('/#/login')
  await expect(page.locator('#app')).toBeVisible()
  // поле имени пользователя присутствует
  await expect(page.getByRole('textbox').first()).toBeVisible({ timeout: 15_000 })
})
