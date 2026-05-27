import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyAccessToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import DashSidebar from '@/components/dashboard/DashSidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const headerList = await headers()
  const token = cookieStore.get('user_token')?.value
  const currentPath = headerList.get('x-pathname') || '/dashboard'
  const loginRedirect = `/auth/login?redirect=${encodeURIComponent(currentPath)}`

  if (!token) redirect(loginRedirect)

  const payload = await verifyAccessToken(token)
  if (!payload) redirect(loginRedirect)

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      name: true,
      credits: true,
      subscriptionPlan: true,
      subscriptionExpiresAt: true,
      role: true,
    },
  })
  if (!user) redirect(loginRedirect)

  return (
    <div className="dash-layout">
      <DashSidebar user={user} />
      <main className="dash-content">
        {children}
      </main>
    </div>
  )
}
