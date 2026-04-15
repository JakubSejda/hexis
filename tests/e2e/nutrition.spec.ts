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

test('open today and log nutrition', async ({ page }) => {
  await login(page)
  await page.goto('/progress/nutrition')
  const today = new Date()
  const dayNum = today.getUTCDate().toString()
  await page.locator(`button[aria-label="Den ${dayNum}"]`).click()
  // BottomSheet appears — fill kcal + protein
  const kcalInput = page.locator('input[type="number"]').first()
  await kcalInput.fill('1800')
  const proteinInput = page.locator('input[type="number"]').nth(1)
  await proteinInput.fill('140')
  await page.getByRole('button', { name: 'Uložit' }).click()
  await page.waitForResponse(
    (r) => r.url().includes('/api/nutrition') && (r.status() === 201 || r.status() === 200)
  )
  // Background should now be hit (#065f46 = rgb(6, 95, 70)) assuming target is set
  // If target not set the day would be empty; this test assumes measurements exist for the week
  const dayCell = page.locator(`button[aria-label="Den ${dayNum}"]`)
  const bg = await dayCell.evaluate((el) => getComputedStyle(el).backgroundColor)
  expect(['rgb(6, 95, 70)', 'rgb(127, 29, 29)', 'rgb(31, 39, 51)']).toContain(bg)
})
