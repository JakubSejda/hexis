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

test.describe('/stats — muscle rank surface', () => {
  test('renders the three regions and the radar (or its empty state)', async ({ page }) => {
    await login(page)
    await page.goto('/stats')

    // RegionHeader applies CSS `uppercase` — actual DOM text is original casing
    await expect(page.getByText('Avatar Progress')).toBeVisible()
    await expect(page.getByText('Muscle Rank')).toBeVisible()
    await expect(page.getByText('XP History')).toBeVisible()

    const radar = page.locator('svg[role="img"][aria-label="Muscle rank radar"]')
    const emptyCta = page.getByRole('link', { name: 'Spustit trénink' })

    const hasRadar = (await radar.count()) > 0
    const hasEmpty = (await emptyCta.count()) > 0
    // XOR: exactly one of {radar, empty CTA} must render — the test never silently passes
    // by falling through to the wrong branch.
    expect(hasRadar !== hasEmpty).toBe(true)

    if (hasRadar) {
      await expect(radar).toBeVisible()
      // rank summary line: "2× S · 5× A · …" — spot-check S and D present
      await expect(page.getByText(/× S/)).toBeVisible()
      await expect(page.getByText(/× D/)).toBeVisible()
      // weakest-muscles panel header
      await expect(page.getByRole('heading', { name: 'Doplň' })).toBeVisible()
    } else {
      await expect(emptyCta).toBeVisible()
    }
  })
})
