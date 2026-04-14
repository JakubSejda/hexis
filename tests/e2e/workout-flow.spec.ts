import { test, expect } from '@playwright/test'

// Precondition: the test user from M1 bootstrap is seeded. Credentials come from env.

const EMAIL = process.env.E2E_EMAIL ?? 'jakub@test.com'
const PASSWORD = process.env.E2E_PASSWORD ?? 'ChangeMe1'

async function login(page: any) {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(EMAIL)
  await page.getByLabel(/heslo/i).fill(PASSWORD)
  await page.getByRole('button', { name: /přihlásit/i }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}

test('start workout, log 3 sets, finish', async ({ page }) => {
  await login(page)
  await page.goto('/workout')
  await page.getByRole('button', { name: /upper a/i }).click()
  await expect(page).toHaveURL(/\/workout\/\d+/)
  // Log 3 sets
  for (let i = 0; i < 3; i++) {
    await page.getByLabel('zvýšit').first().click()
    await page.getByRole('button', { name: /zapsat sérii/i }).click()
    await page.waitForResponse((r) => r.url().includes('/sets') && r.status() === 201)
  }
  await page.getByRole('button', { name: /dokončit trénink/i }).click()
  await expect(page).toHaveURL(/\/dashboard/)
})

test('add ad-hoc exercise in active session', async ({ page }) => {
  await login(page)
  await page.goto('/workout')
  await page.getByRole('button', { name: /upper a/i }).click()
  await page.getByRole('button', { name: /\+ přidat cvik/i }).click()
  await page.getByPlaceholder('Hledej...').fill('curl')
  await page
    .getByRole('button', { name: /.*curl.*/i })
    .first()
    .click()
  // Assert it appears in stepper
  await expect(page.getByText(/curl/i)).toBeVisible()
})

test('edit set in finished session', async ({ page }) => {
  await login(page)
  // Navigate to most recent finished session via history list
  await page.goto('/workout')
  const first = page.locator('a[href^="/workout/"]').first()
  await first.click()
  await page.getByRole('button', { name: /upravit/i }).click()
  const firstSet = page.locator('button:has-text("Série")').first()
  await firstSet.click()
  await page.getByLabel('zvýšit').nth(1).click() // reps+1
  await page.getByRole('button', { name: /uložit/i }).click()
  // Sheet closes + page re-renders
  await expect(page.locator('[role="dialog"]')).toHaveCount(0)
})
