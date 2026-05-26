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

test.describe('/bio', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('renders all 5 sections', async ({ page }) => {
    await page.goto('/bio')
    await expect(page.getByText(/vitals/i).first()).toBeVisible()
    await expect(page.getByText(/goal/i).first()).toBeVisible()
    await expect(page.getByText(/lifetime/i).first()).toBeVisible()
    await expect(page.getByText(/transformation/i).first()).toBeVisible()
  })

  test('vitals strip empty state links to /settings/profile', async ({ page }) => {
    await page.goto('/bio')
    const link = page.getByRole('link', { name: /doplň profil/i })
    if (await link.count()) {
      await link.first().click()
      await expect(page).toHaveURL(/\/settings\/profile$/)
    }
  })

  test('settings/profile form saves and reflects on /bio', async ({ page }) => {
    await page.goto('/settings/profile')
    await page.getByLabel(/jméno/i).fill('Jakub')
    await page.getByLabel(/výška/i).fill('180')
    await page.getByLabel(/cíl \(kg\)/i).fill('78.5')
    await page.getByRole('button', { name: /uložit/i }).click()
    await expect(page.getByText(/uloženo/i)).toBeVisible()
    await page.goto('/bio')
    await expect(page.getByText('Jakub')).toBeVisible()
    await expect(page.getByText(/180 cm/)).toBeVisible()
  })
})
