import { loadEnvConfig } from '@next/env'
import path from 'path'

/** Runs before webServer — env validation only (no HTTP). */
export default async function globalSetup() {
  loadEnvConfig(path.join(__dirname, '..'))

  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is missing. Copy .env.example to .env (or use .env.local) before running E2E tests.'
    )
  }

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is missing. Required for login/session in E2E tests.')
  }
}
