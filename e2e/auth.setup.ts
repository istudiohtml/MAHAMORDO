import { test as setup, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const authDir = path.join(__dirname, '.auth')
const authFile = path.join(authDir, 'user.json')

setup('authenticate seeded user', async ({ request, baseURL }) => {
  const origin = baseURL!.replace(/\/$/, '')

  const health = await request.get('/api/health')
  expect(health.ok(), `server/db not ready: ${await health.text()}`).toBeTruthy()

  const email = process.env.E2E_USER_EMAIL ?? 'superadmin@mahamordo.com'
  const password = process.env.E2E_USER_PASSWORD ?? 'superadmin1234'

  const res = await request.post('/api/user/auth/login', {
    data: { email, password },
    headers: {
      origin,
      referer: `${origin}/auth/login`,
    },
  })

  expect(
    res.ok(),
    `login failed (${res.status()}): ${await res.text()}\nRun: npm run db:seed`
  ).toBeTruthy()

  fs.mkdirSync(authDir, { recursive: true })
  await request.storageState({ path: authFile })
})
