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

test.describe('SP3 dashboard composition', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('StatusWindow, TodayQuest, and 4 Life Area cards render', async ({ page }) => {
    await expect(page.getByText(/Level \d+/).first()).toBeVisible()
    await expect(page.getByText(/Today.s Quest/i)).toBeVisible()
    for (const label of ['TRAINING', 'NUTRITION', 'PROGRESS', 'STATS']) {
      await expect(page.getByText(label).first()).toBeVisible()
    }
  })

  test('region headers visible', async ({ page }) => {
    await expect(page.getByText(/Life Areas/i).first()).toBeVisible()
    await expect(page.getByText(/Muscle Volume/i).first()).toBeVisible()
    await expect(page.getByText(/This Week/i).first()).toBeVisible()
  })

  test('clicking TRAINING life area navigates to /training', async ({ page }) => {
    await page.getByRole('link').filter({ hasText: 'TRAINING' }).first().click()
    await expect(page).toHaveURL(/\/training/)
  })

  test('clicking STATS life area navigates to /stats', async ({ page }) => {
    await page.goto('/dashboard')
    await page.getByRole('link').filter({ hasText: 'STATS' }).first().click()
    await expect(page).toHaveURL(/\/stats/)
  })

  test('week peek strip links to /training', async ({ page }) => {
    await page.goto('/dashboard')
    const weekPeek = page.locator('a', { hasText: /workout.*rest.*future/i }).first()
    await weekPeek.click()
    await expect(page).toHaveURL(/\/training/)
  })
})
