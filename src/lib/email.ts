import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@mahamordo.app'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function sendPasswordResetEmail(email: string, resetToken: string) {
  const resetLink = `${APP_URL}/auth/reset-password?token=${resetToken}`

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'MAHAMORDO - ตั้งรหัสผ่านใหม่',
      html: `
        <div style="font-family: 'Prompt', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #B8860B; margin-bottom: 20px;">🔮 MAHAMORDO</h2>

          <p style="color: #333; line-height: 1.6;">
            สวัสดีครับ/ค่ะ
          </p>

          <p style="color: #333; line-height: 1.6;">
            เราได้รับคำขอเพื่อตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ โปรดคลิกปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="display: inline-block; padding: 12px 30px; background-color: #B8860B; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
              ตั้งรหัสผ่านใหม่
            </a>
          </div>

          <p style="color: #666; font-size: 13px; line-height: 1.6;">
            หรือคัดลอกลิงค์นี้ไปยังเบราว์เซอร์:
          </p>
          <p style="color: #0066cc; font-size: 12px; word-break: break-all;">
            ${resetLink}
          </p>

          <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
            ลิงค์นี้จะหมดอายุใน 1 ชั่วโมง<br>
            หากคุณไม่ได้ขอให้ตั้งรหัสผ่านใหม่ โปรดเพิกเฉยต่ออีเมลนี้
          </p>
        </div>
      `,
    })

    if (result.error) {
      console.error('Resend error:', result.error)
      return { success: false, error: result.error.message }
    }

    console.log('Password reset email sent:', result.data?.id)
    return { success: true, messageId: result.data?.id }
  } catch (error) {
    console.error('Failed to send password reset email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

export async function sendVerificationEmail(email: string, verificationToken: string) {
  const verifyLink = `${APP_URL}/auth/verify-email?token=${verificationToken}`

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'MAHAMORDO - ยืนยันอีเมล',
      html: `
        <div style="font-family: 'Prompt', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #B8860B; margin-bottom: 20px;">🔮 MAHAMORDO</h2>

          <p style="color: #333; line-height: 1.6;">
            ยินดีต้อนรับสู่ MAHAMORDO!
          </p>

          <p style="color: #333; line-height: 1.6;">
            โปรดยืนยันอีเมลของคุณเพื่อเริ่มต้นการดูดวง
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyLink}" style="display: inline-block; padding: 12px 30px; background-color: #B8860B; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
              ยืนยันอีเมล
            </a>
          </div>

          <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
            ลิงค์นี้จะหมดอายุใน 24 ชั่วโมง
          </p>
        </div>
      `,
    })

    if (result.error) {
      console.error('Resend error:', result.error)
      return { success: false, error: result.error.message }
    }

    return { success: true, messageId: result.data?.id }
  } catch (error) {
    console.error('Failed to send verification email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}
