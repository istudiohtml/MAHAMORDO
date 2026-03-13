import { NextResponse } from 'next/server'

// Apple Sign In requires Apple Developer account configuration:
// - APPLE_CLIENT_ID (Service ID)
// - APPLE_TEAM_ID
// - APPLE_KEY_ID
// - APPLE_PRIVATE_KEY (.p8 file content)
// See: https://developer.apple.com/sign-in-with-apple/

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  if (!process.env.APPLE_CLIENT_ID || !process.env.APPLE_TEAM_ID) {
    return NextResponse.redirect(`${appUrl}/auth/login?error=apple_not_configured`)
  }

  // TODO: Implement Apple OAuth when Apple Developer credentials are configured
  // Apple requires form_post response_mode and a JWT client_secret
  return NextResponse.redirect(`${appUrl}/auth/login?error=apple_not_configured`)
}
