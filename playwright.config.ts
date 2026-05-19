import { defineConfig, devices } from '@playwright/test'
import { loadEnvConfig } from '@next/env'
import path from 'path'

const projectDir = path.join(__dirname)
loadEnvConfig(projectDir)

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
const authFile = path.join(__dirname, 'e2e/.auth/user.json')
const isCI = !!process.env.CI

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: 1,
  globalSetup: require.resolve('./e2e/global-setup'),
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 90_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: authFile,
      },
      dependencies: ['setup'],
      testIgnore: [/auth\.spec\.ts/, /public\.spec\.ts/, /auth\.setup\.ts/],
    },
    {
      name: 'chromium-unauth',
      use: { ...devices['Desktop Chrome'] },
      testMatch: [/auth\.spec\.ts/, /public\.spec\.ts/],
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: `${baseURL.replace(/\/$/, '')}/api/health`,
    reuseExistingServer: !isCI,
    timeout: 180_000,
    env: {
      ...process.env,
      E2E_MOCK_AI: 'true',
      NEXT_PUBLIC_E2E_FAST_TYPING: 'true',
      E2E_DISABLE_RATE_LIMIT: 'true',
    },
  },
})
