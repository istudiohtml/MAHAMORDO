import { test, expect } from '@playwright/test'
import { loginUser, startFortuneSession } from './helpers/api'
import { createEmailUser, deleteUserByEmail } from './helpers/db'

const MOCK_REPLY = 'คำทำนายทดสอบ E2E — โชคดีในเรื่องที่ถาม'

test.describe('Fortune flow (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/fortune', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue()
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ reply: MOCK_REPLY }),
      })
    })
  })

  test('oracle 1 session: subject → birth → topic → AI reply', async ({ page }) => {
    await page.goto('/fortune/1')

    await expect(page.getByRole('button', { name: 'ตัวเอง' })).toBeVisible({ timeout: 60_000 })
    await page.getByRole('button', { name: 'ตัวเอง' }).click()

    await page.locator('input[type="date"]').fill('1990-01-15')
    await page.getByRole('button', { name: 'ยืนยัน' }).click()

    await page.getByRole('button', { name: 'ความรัก' }).click()

    const input = page.getByPlaceholder('พิมพ์คำถามของคุณ...')
    await expect(input).toBeVisible({ timeout: 15_000 })
    await input.fill('ขอคำทำนายสั้นๆ')
    await page.getByRole('button', { name: 'ส่ง' }).click()

    await expect(page.locator('.fortune-vn-speech-text')).toContainText('คำทำนายทดสอบ E2E', {
      timeout: 20_000,
    })
  })

  test('API returns 402 when credits insufficient', async ({ playwright, baseURL }) => {
    const { email, password } = await createEmailUser(0)
    const request = await playwright.request.newContext({ baseURL })

    try {
      await loginUser(request, baseURL!, email, password)
      const blocked = await startFortuneSession(request, 'mae-mor-jan')
      expect(blocked.status()).toBe(402)
    } finally {
      await request.dispose()
      await deleteUserByEmail(email)
    }
  })

  test('oracle 3 shows tarot picker after topic', async ({ page }) => {
    await page.goto('/fortune/3')

    await expect(page.getByRole('button', { name: 'ตัวเอง' })).toBeVisible({ timeout: 60_000 })
    await page.getByRole('button', { name: 'ตัวเอง' }).click()
    await page.locator('input[type="date"]').fill('1990-06-20')
    await page.getByRole('button', { name: 'ยืนยัน' }).click()
    await page.getByRole('button', { name: 'การงาน' }).click()

    await expect(page.getByText('เลือกไพ่ 3 ใบ')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('.vn-tarot-grid')).toBeVisible()
  })

})
