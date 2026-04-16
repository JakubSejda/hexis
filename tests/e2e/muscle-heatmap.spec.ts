import { test, expect } from '@playwright/test'

test.describe('Muscle heatmap', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'demo@hexis.local')
    await page.fill('input[name="password"]', 'Demo1234')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('dashboard shows muscle heatmap widget', async ({ page }) => {
    await expect(page.getByText('Posledních 7 dní')).toBeVisible()
  })
})
