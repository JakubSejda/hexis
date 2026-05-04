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

test.describe('SP5 PR-2 Habits', () => {
  test('happy path: create daily habit, check today, see streak, uncheck, see 0', async ({
    page,
  }) => {
    await login(page)
    await page.getByRole('link', { name: /^habits$/i }).click()
    await expect(page).toHaveURL(/\/habits/)

    const uniqueName = `e2e-voda-${Date.now()}`
    await page.getByRole('button', { name: /\+ založ první návyk|\+ nový/i }).click()
    await page.getByLabel(/název návyku/i).fill(uniqueName)
    await page.getByRole('button', { name: /vytvořit/i }).click()

    const row = page.locator(`[data-habit-row]:has-text("${uniqueName}")`)
    await expect(row).toBeVisible()

    await row.getByRole('checkbox').check()
    await expect(row.locator('[data-streak-count]')).toContainText('🔥 1')

    await page.reload()
    const rowAfter = page.locator(`[data-habit-row]:has-text("${uniqueName}")`)
    await expect(rowAfter.getByRole('checkbox')).toBeChecked()
    await expect(rowAfter.locator('[data-streak-count]')).toContainText('🔥 1')

    const cb = rowAfter.getByRole('checkbox')
    const box = await cb.boundingBox()
    if (!box) throw new Error('checkbox not visible')
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.waitForTimeout(700)
    await page.mouse.up()

    await page.reload()
    const rowFinal = page.locator(`[data-habit-row]:has-text("${uniqueName}")`)
    await expect(rowFinal.getByRole('checkbox')).not.toBeChecked()
    await expect(rowFinal.locator('[data-streak-count]')).toContainText('🔥 0')
  })

  test("Today's Checks card appears on dashboard after creating a daily habit", async ({
    page,
  }) => {
    await login(page)
    await page.goto('/habits')
    const uniqueName = `e2e-dash-${Date.now()}`
    await page.getByRole('button', { name: /\+ založ první návyk|\+ nový/i }).click()
    await page.getByLabel(/název návyku/i).fill(uniqueName)
    await page.getByRole('button', { name: /vytvořit/i }).click()
    await expect(page.locator(`[data-habit-row]:has-text("${uniqueName}")`)).toBeVisible()

    await page.goto('/dashboard')
    const card = page.locator('[data-todays-checks-card]')
    await expect(card).toBeVisible()
    await expect(card).toContainText("Today's Checks")
    await expect(card).toContainText(uniqueName)
  })
})
