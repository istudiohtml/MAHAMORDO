import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyAccessToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import DashSidebar from '@/components/dashboard/DashSidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('user_token')?.value

  if (!token) redirect('/auth/login?redirect=/dashboard')

  const payload = await verifyAccessToken(token)
  if (!payload) redirect('/auth/login?redirect=/dashboard')

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, credits: true },
  })
  if (!user) redirect('/auth/login')

  return (
    <div className="dash-layout">
      <DashSidebar user={user} />
      <main className="dash-content">
        {children}
      </main>
    </div>
  )
}
