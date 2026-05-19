import { APIRequestContext, expect } from '@playwright/test'

export function apiHeaders(baseURL: string) {
  const origin = baseURL.replace(/\/$/, '')
  return {
    origin,
    referer: `${origin}/auth/login`,
  }
}

export async function registerUser(
  request: APIRequestContext,
  baseURL: string,
  email: string,
  password: string,
  name = 'E2E User'
) {
  const res = await request.post('/api/user/auth/register', {
    data: { email, password, name },
    headers: apiHeaders(baseURL),
  })
  expect(res.ok(), `register failed: ${await res.text()}`).toBeTruthy()
  return res
}

export async function loginUser(
  request: APIRequestContext,
  baseURL: string,
  email: string,
  password: string
) {
  const res = await request.post('/api/user/auth/login', {
    data: { email, password },
    headers: apiHeaders(baseURL),
  })
  expect(res.ok(), `login failed: ${await res.text()}`).toBeTruthy()
  return res
}

export async function startFortuneSession(
  request: APIRequestContext,
  oracleSlug: string
) {
  return request.post('/api/fortune/start', {
    data: { oracleSlug },
    headers: { 'Content-Type': 'application/json' },
  })
}
