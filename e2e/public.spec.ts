import { test, expect } from '@playwright/test'

test.describe('Public pages', () => {
  test('home loads after splash', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'หมอดู' })).toBeVisible({ timeout: 30_000 })
  })

  test('fortune select page shows oracles', async ({ page }) => {
    await page.goto('/fortune')
    await expect(page.getByText('เลือกหมอดูของคุณ')).toBeVisible()
    await expect(page.getByRole('link', { name: /แม่หมอจันทร์/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /พ่อหมอซอน/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /อาจารย์ราหู/ })).toBeVisible()
  })

  test('pricing page loads', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page.locator('body')).toContainText(/เครดิต|ราคา|แพ็ก/i)
  })

  test('fortune session requires login', async ({ page }) => {
    await page.goto('/fortune/1')
    await expect(page).toHaveURL(/\/auth\/login/)
  })
})
