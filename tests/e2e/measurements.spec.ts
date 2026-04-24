import { test, expect, type Page } from '@playwright/test'

const EMAIL = process.env.E2E_EMAIL ?? 'jakub@test.com'
const PASSWORD = process.env.E2E_PASSWORD ?? 'ChangeMe1'

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(EMAIL)
  await page.getByLabel(/heslo/i).fill(PASSWORD)
  await page.getByRole('button', { name: /přihlásit/i }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}

test('navigate to body progress and edit a weight cell', async ({ page }) => {
  await login(page)
  await page.goto('/progress')
  await expect(page.getByRole('tab', { name: 'Tělo' })).toHaveAttribute('aria-selected', 'true')
  // First row = current week. Second cell = weight.
  const weightCell = page.locator('table tbody tr').first().locator('td').nth(1).locator('button')
  await weightCell.click()
  const input = page.locator('table tbody tr').first().locator('td').nth(1).locator('input')
  await input.fill('72.50')
  await input.press('Enter')
  await page.waitForResponse(
    (r) => r.url().includes('/api/measurements') && (r.status() === 201 || r.status() === 200)
  )
  await page.reload()
  await expect(page.locator('table tbody tr').first().locator('td').nth(1)).toContainText('72.50')
})

test('segment control navigates to nutrition', async ({ page }) => {
  await login(page)
  await page.goto('/progress')
  await page.getByRole('tab', { name: 'Výživa' }).click()
  await expect(page).toHaveURL(/\/nutrition/)
})
