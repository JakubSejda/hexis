import { test, expect } from '@playwright/test'

test.describe('Body photos page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'demo@hexis.local')
    await page.fill('input[name="password"]', 'Demo1234')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('navigates to photos tab and shows empty state', async ({ page }) => {
    await page.goto('/progress/photos')
    await expect(page.getByRole('tab', { name: 'Fotky' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByText('Žádné fotky')).toBeVisible()
  })

  test('upload FAB opens sheet', async ({ page }) => {
    await page.goto('/progress/photos')
    await page.getByLabel('Nahrát fotku').click()
    await expect(page.getByText('Nahrát fotku')).toBeVisible()
  })
})
