import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function createEmailUser(credits: number, email?: string) {
  const resolvedEmail = email ?? `e2e-db-${Date.now()}@mahamordo.test`
  const password = 'E2eTest123'
  const hashed = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      email: resolvedEmail,
      password: hashed,
      name: 'E2E User',
      credits,
      role: 'USER',
    },
  })

  return { user, email: resolvedEmail, password }
}

export async function deleteUserByEmail(email: string) {
  await prisma.user.deleteMany({ where: { email } })
}

export async function disconnectDb() {
  await prisma.$disconnect()
}
