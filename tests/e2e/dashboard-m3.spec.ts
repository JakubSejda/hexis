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

test('dashboard shows M3 widgets', async ({ page }) => {
  await login(page)
  await expect(page.getByText('Dnešní výživa')).toBeVisible()
  await expect(page.getByText('Tento týden')).toBeVisible()
  await expect(page.getByText('Výživa streak')).toBeVisible()
})

test('Progres tab is reachable from main nav', async ({ page }) => {
  await login(page)
  await page.getByRole('link', { name: 'Progres' }).click()
  await expect(page).toHaveURL(/\/progress\/body/)
})
