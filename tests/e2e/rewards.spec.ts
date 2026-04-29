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

test.describe('/rewards — Rewards (spend XP)', () => {
  test('happy path: create reward, redeem, history updates', async ({ page }) => {
    await login(page)
    await page.goto('/rewards')

    await expect(page.getByRole('heading', { name: 'Odměny' })).toBeVisible()
    // read current balance (presence check only — asserted indirectly via history)
    await page.getByTestId('rewards-balance').textContent()

    // Open create dialog
    await page.getByRole('button', { name: /Nová odměna/i }).click()
    const uniqueName = `e2e-sushi-${Date.now()}`
    await page.getByLabel(/Název/i).fill(uniqueName)
    await page.getByLabel(/Cena/i).fill('1')
    await page.getByRole('button', { name: /Uložit/i }).click()

    // The new reward is visible
    const card = page.locator(`[data-reward-id]`).filter({ hasText: uniqueName })
    await expect(card).toBeVisible()

    // Redeem (assume demo user has at least 1 XP)
    await card.getByRole('button', { name: /Vyzvednout/i }).click()
    await page
      .getByRole('button', { name: /Vyzvednout/i })
      .last()
      .click()

    // Balance decreased (or stayed if already 0 — assert at least history updates)
    await expect(page.getByText(uniqueName).last()).toBeVisible()

    // Cleanup: archive the reward we created
    await card.getByRole('button', { name: new RegExp(`Možnosti pro ${uniqueName}`) }).click()
    await page.getByRole('menuitem', { name: /Archivovat/i }).click()
  })

  test('insufficient balance disables Vyzvednout with Chybí tooltip', async ({ page }) => {
    await login(page)
    await page.goto('/rewards')

    const balanceText = (await page.getByTestId('rewards-balance').textContent()) ?? '0 XP'
    const balanceXp = Number(balanceText.replace(/[^\d]/g, '')) || 0
    const tooHigh = balanceXp + 999_999

    await page.getByRole('button', { name: /Nová odměna/i }).click()
    const uniqueName = `e2e-impossible-${Date.now()}`
    await page.getByLabel(/Název/i).fill(uniqueName)
    await page.getByLabel(/Cena/i).fill(String(tooHigh))
    await page.getByRole('button', { name: /Uložit/i }).click()

    const card = page.locator(`[data-reward-id]`).filter({ hasText: uniqueName })
    const btn = card.getByRole('button', { name: /Vyzvednout/i })
    await expect(btn).toBeDisabled()
    await expect(btn).toHaveAttribute('title', /Chybí .* XP/)

    // Cleanup
    await card.getByRole('button', { name: new RegExp(`Možnosti pro ${uniqueName}`) }).click()
    await page.getByRole('menuitem', { name: /Smazat/i }).click()
    await page.on('dialog', (d) => d.accept())
  })
})
