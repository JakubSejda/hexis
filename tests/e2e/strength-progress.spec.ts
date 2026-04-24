import { test, expect } from '@playwright/test'

test.describe('Strength progress page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'demo@hexis.local')
    await page.fill('input[name="password"]', 'Demo1234')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('navigates to strength tab and renders charts', async ({ page }) => {
    await page.goto('/stats/strength')
    await expect(page.getByRole('tab', { name: 'Síla' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByText('Estimated 1RM')).toBeVisible()
    await expect(page.getByText('Objem per svalovou skupinu')).toBeVisible()
  })

  test('time range picker switches range', async ({ page }) => {
    await page.goto('/stats/strength')
    await page.getByRole('tab', { name: '30d' }).click()
    await expect(page.getByText('Estimated 1RM')).toBeVisible()
  })
})
