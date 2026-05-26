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

test.describe('/calendar', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('renders header, grid, legend', async ({ page }) => {
    await page.goto('/calendar')
    await expect(page.getByText(/Training/).first()).toBeVisible()
    await expect(page.getByText(/3\+ den streak/i)).toBeVisible()
  })

  test('prev/next nav updates ?ym', async ({ page }) => {
    await page.goto('/calendar')
    await page.getByRole('link', { name: /předchozí měsíc/i }).click()
    await expect(page).toHaveURL(/\?ym=\d{4}-\d{2}/)
  })

  test('day click opens modal', async ({ page }) => {
    await page.goto('/calendar')
    // First non-blank cell — generic selector via [data-date]
    const firstCell = page.locator('[data-date]').first()
    await firstCell.click()
    await expect(page.getByRole('button', { name: /zavřít/i })).toBeVisible()
    await page.getByRole('button', { name: /zavřít/i }).click()
    await expect(page.getByRole('button', { name: /zavřít/i })).not.toBeVisible()
  })
})
