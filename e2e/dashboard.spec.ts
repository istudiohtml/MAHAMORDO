import { test, expect } from '@playwright/test'

test.describe('Dashboard (authenticated)', () => {
  test('dashboard home shows oracle cards', async ({ page }) => {
    await page.goto('/dashboard')
    const oracleCards = page.locator('.dash-oracle-cards .dash-oracle-name')
    await expect(oracleCards).toHaveCount(3)
    await expect(oracleCards.filter({ hasText: 'แม่หมอจันทร์' })).toBeVisible()
    await expect(oracleCards.filter({ hasText: 'พ่อหมอซอน' })).toBeVisible()
    await expect(oracleCards.filter({ hasText: 'อาจารย์ราหู' })).toBeVisible()
  })

  test('sidebar navigation works', async ({ page }) => {
    await page.goto('/dashboard')

    await page.getByRole('link', { name: 'ประวัติดูดวง' }).click()
    await expect(page).toHaveURL(/\/dashboard\/history/)

    await page.getByRole('link', { name: 'เครดิต' }).click()
    await expect(page).toHaveURL(/\/dashboard\/credits/)

    await page.getByRole('link', { name: 'ข้อมูลส่วนตัว' }).click()
    await expect(page).toHaveURL(/\/dashboard\/profile/)
  })

  test('oracle card links to fortune session', async ({ page }) => {
    await page.goto('/dashboard')
    await page.getByRole('link', { name: /แม่หมอจันทร์/ }).first().click()
    await expect(page).toHaveURL(/\/fortune\/1/)
  })
})
