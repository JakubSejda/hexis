import { test, expect } from '@playwright/test'

test.describe('PWA', () => {
  test('manifest.json is accessible', async ({ page }) => {
    const response = await page.goto('/manifest.json')
    expect(response?.status()).toBe(200)
    const json = await response?.json()
    expect(json.name).toBe('Hexis')
    expect(json.display).toBe('standalone')
    expect(json.icons.length).toBeGreaterThanOrEqual(3)
  })

  test('icons are accessible', async ({ page }) => {
    const res192 = await page.goto('/icons/icon-192.png')
    expect(res192?.status()).toBe(200)
    const res512 = await page.goto('/icons/icon-512.png')
    expect(res512?.status()).toBe(200)
  })
})
