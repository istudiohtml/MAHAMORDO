# MAHAMORDO — Smoke Test Checklist

ใช้ก่อน deploy หรือหลัง merge ใหญ่  
เวลาโดยประมาณ: **45–60 นาที** (ครบทุกข้อ)

อัปเดต: 2026-05-18

---

## ก่อนเริ่ม

### เตรียม environment

```bash
cp .env.local .env          # Prisma ต้องการ .env
npm run db:migrate
npm run db:seed
npm run dev                 # http://localhost:3000
```

### Stripe webhook (local — สำหรับทดสอบชำระเงิน)

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

คัดลอก `whsec_...` ใส่ `STRIPE_WEBHOOK_SECRET` ใน `.env.local` แล้ว restart `npm run dev`

### บัญชีทดสอบ

| บัญชี | รหัสผ่าน | ใช้ทด |
|--------|----------|--------|
| `superadmin@mahamordo.com` | `superadmin1234` | CMS + user app (999 credits) |
| สมัครใหม่ | รหัสผ่านตามกฎ (8+ ตัว, ใหญ่/เล็ก/ตัวเลข) | flow สมาชิกใหม่ (+3 credits) |

### หมอดู (oracle)

| ID | URL | ชื่อ | เครดิต |
|----|-----|------|--------|
| 1 | `/fortune/1` | แม่หมอจันทร์ | 1 |
| 2 | `/fortune/2` | พ่อหมอซอน | 1 |
| 3 | `/fortune/3` | อาจารย์ราหู | 2 (+ เลือกไพ่ 3 ใบ) |

### วิธีบันทึกผล

- `[ ]` = ยังไม่ทด / fail  
- `[x]` = ผ่าน  
- ใส่หมายเหตุสั้นๆ ในคอลัมน์ **หมายเหตุ** ถ้า fail

---

## A. Public / Landing (ไม่ login)

| # | ขั้นตอน | คาดหวัง | ✓ | หมายเหตุ |
|---|---------|---------|---|----------|
| A1 | เปิด `/` | Loading screen → หน้า home แสดง 3 หมอดู | | |
| A2 | คลิกหมอดูบน home | Slide เข้า detail, รูป/ข้อความถูกตัวละคร | | |
| A3 | ปุ่มนำทาง ซ้าย/ขวา (detail) | เปลี่ยนหมอดูได้ | | |
| A4 | คลิก Nav **หมอดู** | ไป `/fortune` แสดงการ์ด 3 ใบ | | |
| A5 | คลิก Nav **ราคา** | ไป `/pricing` แสดงแพ็กเกจ | | |
| A6 | คลิก Nav **เข้าสู่ระบบ** (ยังไม่ login) | ไป `/auth/login` | | |
| A7 | Responsive มือถือ (~390px) | ไม่ล้น / ปุ่มกดได้ | | |

---

## B. Auth — Email

| # | ขั้นตอน | คาดหวัง | ✓ | หมายเหตุ |
|---|---------|---------|---|----------|
| B1 | `/auth/register` สมัครอีเมลใหม่ | สำเร็จ → redirect `/dashboard` | | |
| B2 | ตรวจ credits หลังสมัคร | ได้ **3 credits** (ตาม seed setting) | | |
| B3 | Logout (sidebar) | กลับหน้า login / ไม่เข้า dashboard ได้ | | |
| B4 | `/auth/login` อีเมล+รหัสผ่านถูก | เข้า dashboard | | |
| B5 | รหัสผ่านผิด | แสดง error ไม่ crash | | |
| B6 | `/auth/forgot-password` | ข้อความสำเร็จ (ไม่บอกว่ามี email หรือไม่) | | |
| B7 | Dev: ดู terminal หลัง forgot-password | มี `[DEV] Password reset link...` | | |
| B8 | เปิดลิงก์ reset → ตั้งรหัสใหม่ | login ด้วยรหัสใหม่ได้ | | |

---

## C. Auth — Google OAuth

> ต้องมี `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` ใน `.env.local`

| # | ขั้นตอน | คาดหวัง | ✓ | หมายเหตุ |
|---|---------|---------|---|----------|
| C1 | คลิก **เข้าสู่ระบบด้วย Google** | redirect Google → กลับแอป | | |
| C2 | หลัง Google login | เข้า dashboard, มีชื่อ/อีเมล | | |
| C3 | ปิด Google env แล้วลอง login | ข้อความ `google_not_configured` (ถ้าทด config) | | |

---

## D. Dashboard (ต้อง login)

| # | ขั้นตอน | คาดหวัง | ✓ | หมายเหตุ |
|---|---------|---------|---|----------|
| D1 | `/dashboard` โดยตรง (ไม่ login) | redirect `/auth/login?redirect=...` | | |
| D2 | `/dashboard` | แสดง stats, การ์ดหมอดู 3 ใบ | | |
| D3 | Sidebar: **ประวัติ** | `/dashboard/history` โหลดได้ | | |
| D4 | Sidebar: **เครดิต** | `/dashboard/credits` แสดงยอด + แพ็กเกจ | | |
| D5 | Sidebar: **โปรไฟล์** | `/dashboard/profile` แก้ชื่อ/วันเกิด บันทึกได้ | | |
| D6 | คลิกการ์ดหมอดูบน dashboard | ไป `/fortune/{id}` | | |

---

## E. Fortune — แม่หมอจันทร์ (Oracle 1, 1 credit)

ใช้บัญชีที่มีเครดิต ≥ 1 บันทึกยอดก่อน: `____` credits

| # | ขั้นตอน | คาดหวัง | ✓ | หมายเหตุ |
|---|---------|---------|---|----------|
| E1 | เปิด `/fortune/1` (login แล้ว) | greeting พิมพ์ทีละตัว, ไม่ error | | |
| E2 | เลือก **ดูให้ตัวเอง** / **ดูให้คนอื่น** | flow ต่อได้ | | |
| E3 | กรอกวันเกิด (ถ้าถาม) | ฟอร์ม submit ได้ | | |
| E4 | เลือกหัวข้อ (ความรัก ฯลฯ) | ไปขั้นถามคำถาม | | |
| E5 | พิมพ์คำถาม → ส่ง | AI ตอบ, avatar talking animation | | |
| E6 | ตรวจ credits หลังเริ่ม session | หัก **1** credit | | |
| E7 | `/dashboard/history` | มี session ใหม่ | | |

---

## F. Fortune — พ่อหมอซอน (Oracle 2)

| # | ขั้นตอน | คาดหวัง | ✓ | หมายเหตุ |
|---|---------|---------|---|----------|
| F1 | `/fortune/2` จบ flow สั้นๆ | ทำงานเหมือน oracle 1, หัก 1 credit | | |

---

## G. Fortune — อาจารย์ราหู (Oracle 3, 2 credits + ไพ่)

| # | ขั้นตอน | คาดหวัง | ✓ | หมายเหตุ |
|---|---------|---------|---|----------|
| G1 | บัญชีมี credits ≥ 2 | | | |
| G2 | `/fortune/3` จนถึงขั้นเลือกไพ่ | modal/grid ไพ่แสดง | | |
| G3 | เลือกไพ่ 3 ใบ | ไม่เลือกซ้ำ, ครบ 3 แล้วอ่านผล | | |
| G4 | หัก credits | **2** credits | | |
| G5 | บัญชี credits = 0 แล้วเปิด `/fortune/3` | ข้อความเครดิตไม่พอ (402) | | |

---

## H. Fortune — สิทธิ์เข้าถึง

| # | ขั้นตอน | คาดหวัง | ✓ | หมายเหตุ |
|---|---------|---------|---|----------|
| H1 | เปิด `/fortune/1` **ไม่ login** | redirect `/auth/login?redirect=...` | | |
| H2 | เปิด `/fortune/99` | fallback เป็น oracle 1 หรือไม่ crash | | |

---

## I. Payments — Stripe (test mode)

> ต้องรัน `stripe listen` และการ์ดทดสอบ `4242 4242 4242 4242`

| # | ขั้นตอน | คาดหวัง | ✓ | หมายเหตุ |
|---|---------|---------|---|----------|
| I1 | `/dashboard/credits` → ซื้อแพ็ก **5 credits (39฿)** | redirect Stripe Checkout | | |
| I2 | ชำระสำเร็จ | กลับ `?payment=success`, credits เพิ่ม (~5) | | |
| I3 | ยกเลิก checkout | กลับ `?payment=cancelled` ไม่หักเงิน | | |
| I4 | Tab subscription (ถ้ามี) | เปิด checkout subscription ได้ | | |
| I5 | Terminal: webhook | event `checkout.session.completed` ไม่ error | | |

---

## J. CMS (Admin)

Login ที่ `/cms/login` ด้วย `superadmin@mahamordo.com`

| # | ขั้นตอน | คาดหวัง | ✓ | หมายเหตุ |
|---|---------|---------|---|----------|
| J1 | Login CMS | เข้า `/cms` dashboard | | |
| J2 | **จัดการหมอดู** `/cms/oracles` | แสดง 3 oracles | | |
| J3 | แก้ oracle (ชื่อ/prompt) → บันทึก | บันทึกสำเร็จ, รีเฟรชแล้วเห็นค่าใหม่ | | |
| J4 | **ตั้งค่าระบบ** (SUPERADMIN) | แก้ setting บันทึกได้ | | |
| J5 | **จัดการผู้ใช้** (SUPERADMIN) | แสดงรายการ user | | |
| J6 | User ธรรมดา (role USER) ลองเข้า `/cms` | ถูกปฏิเสธ / redirect login | | |

---

## K. Build & Console

| # | ขั้นตอน | คาดหวัง | ✓ | หมายเหตุ |
|---|---------|---------|---|----------|
| K1 | `npm run build` | สำเร็จไม่มี error | | |
| K2 | ระหว่างทดทุกหน้า | ไม่มี error แดงใน browser console | | |
| K3 | `npm test` | ผ่านทุก test | | |

---

## สรุปผลรอบทดสอบ

| หมวด | ผ่าน | Fail | ข้าม |
|------|------|------|------|
| A Public | /7 | | |
| B Auth Email | /8 | | |
| C Google | /3 | | |
| D Dashboard | /6 | | |
| E Oracle 1 | /7 | | |
| F Oracle 2 | /1 | | |
| G Oracle 3 | /5 | | |
| H Access | /2 | | |
| I Stripe | /5 | | |
| J CMS | /6 | | |
| K Build | /3 | | |
| **รวม** | /53 | | |

**ผู้ทด:** _______________  
**วันที่:** _______________  
**Branch / commit:** _______________  

**บล็อกเกอร์ (ถ้ามี):**

1. 
2. 

---

## E2E อัตโนมัติ (Playwright)

```bash
# ครั้งแรก (npm run test:e2e จะติดตั้ง Chromium ให้อัตโนมัติผ่าน pretest:e2e)
npm run test:e2e:install   # หรือ: npx playwright install chromium
cp .env.local .env    # Prisma + health check ต้องการ DATABASE_URL
npm run db:seed       # superadmin@mahamordo.com / superadmin1234

# รัน (ปิด dev server เก่าที่ port 3000 ก่อน หรือปล่อยให้ Playwright reuse)
npm run test:e2e

# ถ้า port 3000 ถูกใช้อยู่ — ปิด process เดิม หรือรัน dev ที่อื่นแล้ว:
# Playwright จะ reuse server ที่มีอยู่ (ต้องมี .env + DB พร้อม)

# UI mode
npm run test:e2e:ui
```

ครอบคลุม: public pages, auth, dashboard, fortune flow, หักเครดิต 402

### ถ้า E2E fail ทั้งชุด (14+ tests)

| สาเหตุ | วิธีแก้ |
|--------|---------|
| PostgreSQL ไม่รัน | เปิด Postgres แล้ว `npm run db:seed` |
| ไม่มี `.env` / `DATABASE_URL` | `cp .env.local .env` |
| `setup › authenticate` fail | seed superadmin: `superadmin@mahamordo.com` / `superadmin1234` |
| `/api/health` คืน 503 | DB ต่อไม่ได้ — ตรวจ `DATABASE_URL` |
| dev server เก่าที่ :3000 ไม่มี env E2E | ปิด process ที่ 3000 แล้วรัน `npm run test:e2e` ใหม่ |
| ยังไม่ติดตั้ง browser | `npm run test:e2e:install` (error: `Executable doesn't exist`) |

ตรวจ readiness: เปิด http://localhost:3000/api/health ต้องได้ `{"ok":true,"db":true}`

---

## อ้างอิง

- Backlog: [`docs/REMAINING.md`](./REMAINING.md)
- Seed settings: `free_credits_on_signup=3`, `credit_price_thb=10`
