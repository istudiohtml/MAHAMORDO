import { NextRequest } from 'next/server'
import { verifyAccessToken, AccessTokenPayload } from './jwt'

export async function getUserFromRequest(req: NextRequest): Promise<AccessTokenPayload | null> {
  const token = req.cookies.get('user_token')?.value
  if (!token) return null
  return verifyAccessToken(token)
}
