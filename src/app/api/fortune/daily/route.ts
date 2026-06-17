import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAccessToken } from '@/lib/jwt'
import { anthropic, CLAUDE_FAST_MODEL } from '@/lib/anthropic'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

function todayDate(): Date {
  // Use Thai timezone (UTC+7) for date boundary
  const now = new Date()
  const thai = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }))
  thai.setHours(0, 0, 0, 0)
  return thai
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('user_token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = await verifyAccessToken(token)
    if (!payload?.userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const today = todayDate()
    const fortune = await prisma.dailyFortune.findUnique({
      where: { userId_date: { userId: payload.userId, date: today } },
    })

    return NextResponse.json({ fortune })
  } catch (error) {
    logger.error('Daily fortune GET error', undefined, { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const DAILY_FORTUNE_PROMPT = `คุณคือ "มหาหมอดู" ผู้เชี่ยวชาญโหราศาสตร์ไทย
ให้ดูดวงรายวันสั้นๆ โดยตอบเป็น JSON ตามโครงสร้างนี้เท่านั้น ไม่ต้องมีข้อความอื่น:

{
  "introLine": "ประโยคเปิดสั้นๆ บอกว่าวันนี้ดวงมุ่งไปที่ด้านไหน (ไม่เกิน 1 ประโยค)",
  "zoomWord": "คำสำคัญ 1 คำ เช่น ความรัก | การงาน | การเงิน | สุขภาพ | โชคลาภ",
  "bodyText": "คำทำนายหลัก 2-3 ประโยค เกี่ยวกับ zoomWord วันนี้ (ใช้ภาษาไทยสุภาพ อ่านง่าย)",
  "luckyNumber": "เลขมงคล 1-2 ตัว เช่น 3, 7",
  "luckyColor": "สีมงคลวันนี้ เช่น สีทอง"
}

กฎ: ตอบ JSON เท่านั้น ห้ามมี markdown code block ห้ามมีข้อความนอก JSON`

export async function POST(req: NextRequest) {
  let userId: string | undefined
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('user_token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = await verifyAccessToken(token)
    if (!payload?.userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    userId = payload.userId

    const today = todayDate()

    // Return cached reading if already generated today
    const existing = await prisma.dailyFortune.findUnique({
      where: { userId_date: { userId, date: today } },
    })
    if (existing) return NextResponse.json({ fortune: existing })

    // Get user birth data for personalization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, birthDate: true, birthTime: true },
    })

    const todayStr = new Date().toLocaleDateString('th-TH', {
      timeZone: 'Asia/Bangkok',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const userContext = user?.birthDate
      ? `วันเกิดผู้ใช้: ${new Date(user.birthDate).toLocaleDateString('th-TH')}${user.birthTime ? ` เวลา ${user.birthTime}` : ''}`
      : 'ไม่ทราบวันเกิดผู้ใช้ — ทำนายแบบทั่วไป'

    const userMessage = `วันนี้: ${todayStr}\n${userContext}\n\nกรุณาทำนายดวงรายวันสำหรับผู้ใช้นี้`

    const response = await anthropic.messages.create({
      model: CLAUDE_FAST_MODEL,
      max_tokens: 512,
      system: DAILY_FORTUNE_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    const raw = response.content[0]
    if (raw.type !== 'text') throw new Error('Unexpected response type')

    let parsed: {
      introLine: string
      zoomWord: string
      bodyText: string
      luckyNumber: string
      luckyColor: string
    }
    try {
      parsed = JSON.parse(raw.text.trim())
    } catch {
      // Sometimes Claude wraps in ```json — strip it
      const cleaned = raw.text.replace(/```json\n?|\n?```/g, '').trim()
      parsed = JSON.parse(cleaned)
    }

    const fortune = await prisma.dailyFortune.create({
      data: {
        userId,
        date: today,
        introLine: parsed.introLine,
        zoomWord: parsed.zoomWord,
        bodyText: parsed.bodyText,
        luckyNumber: parsed.luckyNumber,
        luckyColor: parsed.luckyColor,
      },
    })

    logger.info('Daily fortune generated', userId)
    return NextResponse.json({ fortune })
  } catch (error) {
    logger.error('Daily fortune POST error', userId, { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
