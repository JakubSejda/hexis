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

test.describe('SP2 navigation', () => {
  test('all 4 bottom tabs navigate on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 700 })
    await login(page)

    await page.getByRole('link', { name: /training/i }).click()
    await expect(page).toHaveURL(/\/training/)

    await page.getByRole('link', { name: /progress/i }).click()
    await expect(page).toHaveURL(/\/progress/)

    await page.getByRole('link', { name: /stats/i }).click()
    await expect(page).toHaveURL(/\/stats/)

    await page.getByRole('link', { name: /dashboard/i }).click()
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('sidebar is visible on desktop viewport and nav links work', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await login(page)
    await expect(page.getByRole('complementary', { name: /primary/i })).toBeVisible()

    // Click sidebar Nutrition link specifically (use the link role filter)
    await page.getByRole('link', { name: /^nutrition$/i }).click()
    await expect(page).toHaveURL(/\/nutrition/)
  })

  test('SP5 placeholder items exist and are disabled', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await login(page)
    for (const label of ['Rewards', 'Habits', 'Player Bio', 'Quest Calendar']) {
      const placeholder = page.getByText(label)
      await expect(placeholder).toBeVisible()
      const host = placeholder.locator('xpath=ancestor::*[@aria-disabled="true"][1]')
      await expect(host).toHaveCount(1)
    }
  })

  test('old URLs redirect to new paths', async ({ page }) => {
    await login(page)
    const cases: Array<[string, RegExp]> = [
      ['/workout', /\/training$/],
      ['/avatar', /\/stats$/],
      ['/progress/body', /\/progress$/],
      ['/progress/nutrition', /\/nutrition$/],
      ['/progress/strength', /\/stats\/strength$/],
    ]
    for (const [oldPath, newUrl] of cases) {
      await page.goto(oldPath)
      await expect(page).toHaveURL(newUrl)
    }
  })
})
