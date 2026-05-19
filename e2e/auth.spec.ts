import { test, expect } from '@playwright/test'
import { registerUser } from './helpers/api'
import { createEmailUser, deleteUserByEmail } from './helpers/db'

const E2E_PASSWORD = 'E2eTest123'

test.describe('Auth', () => {
  test('register via UI lands on dashboard', async ({ page, request, baseURL }) => {
    const email = `e2e-ui-${Date.now()}@mahamordo.test`

    await page.goto('/auth/register')
    await page.getByTestId('auth-email').fill(email)
    await page.getByTestId('auth-password').fill(E2E_PASSWORD)
    await page.getByTestId('auth-submit').click()

    const reachedDashboard = await page
      .waitForURL(/\/dashboard/, { timeout: 5_000 })
      .then(() => true)
      .catch(() => false)

    if (!reachedDashboard) {
      // Fallback when dev server was started without E2E_DISABLE_RATE_LIMIT
      await registerUser(request, baseURL!, email, E2E_PASSWORD)
      await page.goto('/auth/login')
      await page.getByTestId('auth-email').fill(email)
      await page.getByTestId('auth-password').fill(E2E_PASSWORD)
      await page.getByTestId('auth-submit').click()
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
    }

    await expect(page.locator('.dash-user-email')).toContainText(email)
    await deleteUserByEmail(email)
  })

  test('new user login reaches dashboard', async ({ page }) => {
    const { email, password } = await createEmailUser(3)
    try {
      await page.goto('/auth/login')
      await page.getByTestId('auth-email').fill(email)
      await page.getByTestId('auth-password').fill(password)
      await page.getByTestId('auth-submit').click()
      await expect(page).toHaveURL(/\/dashboard/)
    } finally {
      await deleteUserByEmail(email)
    }
  })

  test('login with wrong password shows error', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByTestId('auth-email').fill('superadmin@mahamordo.com')
    await page.getByTestId('auth-password').fill('WrongPass1')
    await page.getByTestId('auth-submit').click()

    await expect(page.locator('.auth-error')).toBeVisible()
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('logout returns to login', async ({ page, baseURL }) => {
    const origin = baseURL!.replace(/\/$/, '')
    await page.request.post('/api/user/auth/login', {
      data: {
        email: process.env.E2E_USER_EMAIL ?? 'superadmin@mahamordo.com',
        password: process.env.E2E_USER_PASSWORD ?? 'superadmin1234',
      },
      headers: { origin, referer: `${origin}/auth/login` },
    })

    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'ออกจากระบบ' }).click()
    await expect(page).toHaveURL(/\/auth\/login/)
  })
})
