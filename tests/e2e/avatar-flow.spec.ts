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

test('dashboard hero shows avatar and navigates to /avatar', async ({ page }) => {
  await login(page)
  await expect(page.getByAltText(/tier \d/i).first()).toBeVisible()
  await page
    .getByAltText(/tier \d/i)
    .first()
    .click()
  await expect(page).toHaveURL(/\/avatar/)
})

test('/avatar page renders all sections', async ({ page }) => {
  await login(page)
  await page.goto('/avatar')
  await expect(page.getByText('Tvůj avatar')).toBeVisible()
  await expect(page.getByText('Tier ladder')).toBeVisible()
  await expect(page.getByText(/XP za 30 dní/i)).toBeVisible()
  await expect(page.getByText(/Rozpis podle aktivity/i)).toBeVisible()
  const badges = page.locator('button').filter({ hasText: /Rookie|Apprentice|Warrior|Beast|Titan/ })
  await expect(badges).toHaveCount(5)
})
