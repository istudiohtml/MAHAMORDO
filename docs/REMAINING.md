# MAHAMORDO — งานที่เหลือ (Remaining Work)

อัปเดตล่าสุด: 2026-05-18  
ใช้ไฟล์นี้เป็นสารบัญงานค้าง — อัปเดตเมื่อปิดหรือเปิดฟีเจอร์

---

## สถานะโปรเจกต์โดยย่อ

| หมวด | สถานะ |
|------|--------|
| Core app (Next.js + Prisma + Fortune AI) | setup บนเครื่องแล้ว — รัน `npm run dev` |
| Google OAuth | ทำแล้ว — ต้องใส่ credentials |
| **Apple Login** | **ปิดชั่วคราว** — ดูหัวข้อด้านล่าง |
| Stripe payments | โค้ดมี — ต้องตั้งค่า keys + webhook |
| Unit tests | ยังไม่มีไฟล์ test |
| Git | branch ahead `origin/main` ~32 commits, มี WIP ยังไม่ commit |

---

## Apple Login — ปิดชั่วคราว

**ตัดสินใจ:** ไม่ทำ Sign in with Apple ในเฟสนี้

| รายการ | รายละเอียด |
|--------|------------|
| Feature flag | `src/lib/auth-providers.ts` → `apple: false` |
| UI | ไม่แสดงปุ่ม Apple บน login/register |
| API | ไม่มี route `/api/auth/apple` |
| DB | `User.provider` รองรับ `"apple"` ใน schema ไว้สำหรับอนาคต — ยังไม่ใช้ |

**เมื่อจะเปิดใหม่:**

1. ตั้ง `AUTH_PROVIDERS.apple = true` ใน `src/lib/auth-providers.ts`
2. สร้าง Apple Developer Service ID + redirect URI
3. เพิ่ม env: `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`
4. สร้าง `GET /api/auth/apple` + callback route
5. เพิ่มปุ่ม OAuth ใน `auth/login` และ `auth/register`
6. อัปเดตไฟล์นี้และ `.cursor/rules/mahamordo.mdc`

---

## Setup บนเครื่อง (ถ้ายังรันไม่ได้)

- [x] สร้าง `.env` จาก `.env.example` (มี `.env.local` อยู่แล้ว — copy เป็น `.env` สำหรับ Prisma CLI)
- [x] ตั้ง `DATABASE_URL`, `JWT_SECRET`, `ANTHROPIC_API_KEY`
- [x] สร้าง DB: `createdb mahamordo` (มี DB แล้ว)
- [x] `npm install`
- [x] `npm run db:migrate` — schema up to date (15 migrations)
- [x] `npm run db:seed`
- [x] `npm run dev` → http://localhost:3000

> **หมายเหตุ:** Next.js อ่าน `.env.local` ได้; Prisma CLI อ่าน `.env` เท่านั้น — เก็บค่าสำคัญให้ตรงกันทั้งสองไฟล์ (หรือ `cp .env.local .env` หลังแก้ค่า)

### Environment ที่ต้องใส่ตามฟีเจอร์

| ตัวแปร | ใช้เมื่อ |
|--------|----------|
| `DATABASE_URL` | ทุก flow |
| `JWT_SECRET` | login / session |
| `ANTHROPIC_API_KEY` | ดูดวง AI |
| `NEXT_PUBLIC_APP_URL` | redirect, email links |
| `GOOGLE_*` | Google login |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | ซื้อเครดิต / subscription |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | อีเมล reset password (production) |
| `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY` | production / Supabase |

---

## งาน UI / โค้ดที่ยังไม่ commit (WIP)

ไฟล์ที่แก้ค้าง (ตรวจ `git status` ล่าสุด):

- Landing: `src/app/page.tsx`, `globals.css`, `Nav.tsx`
- Fortune: `fortune/page.tsx`, `fortune/[id]/page.tsx`, `components/fortune/*`
- Pricing: `pricing/page.tsx`, `components/pricing/PricingBg.tsx`
- Dashboard: `dashboard/page.tsx`, `DashSidebar.tsx`, `OracleTiltCard.tsx`
- Payments API: `create-checkout`, `create-subscription`
- ทดลอง: `src/app/v2/page.tsx`
- Assets: avatar จัดแล้วใน `public/avatars/` (ดู `_archive/` สำหรับร่าง)

**แนะนำหลังทดสอบ:** commit + push ขึ้น remote

---

## หนี้ทางเทคนิค (ควรเก็บ)

### 1. Oracle slug / avatar ไม่ตรงกัน

- [x] รวม mapping ที่ `src/lib/oracle-assets.ts` (slug ปัจจุบัน + legacy)
- [x] อัปเดต `fortune/[id]`, `FortuneSelectCards`, `OracleTiltCard`
- [x] ลบไฟล์ `ajarn-rah.svg`, `template-ajarn-rah.jpg` (สะกดผิด)
- [ ] ดึง `avatarUrl` จาก API/DB แทน static ใน fortune flow (ถ้าต้องการ)

### 2. รูป avatar กระจายหลายรูปแบบ

- [x] โครงสร้าง canonical: `template-*.jpg` (UI) + `*.svg` (icon/preload)
- [x] ย้าย `IMG_*` ไป `public/avatars/_archive/source-photos/` (ร่าง ไม่ใช้ในแอป)
- [x] รวม path ผ่าน `src/lib/oracle-assets.ts` ทุก component หลัก

### 3. ไฟล์ชั่วคราว / ทดลอง

- `.superpowers/brainstorm/` — prototype HTML (ลบหรือ gitignore ได้ถ้าไม่ใช้)
- [x] ลบ `src/app/v2/page.tsx` (ซ้ำกับ `/` เวอร์ชันเก่า)

### 4. Tests

- [x] `src/lib/oracle-assets.test.ts` (6 cases)
- [ ] auth, fortune API, credit deduction

---

## ฟีเจอร์ที่ยังไม่ทำ / รอ config

| ฟีเจอร์ | หมายเหตุ |
|---------|----------|
| Apple Login | ปิด — ดูหัวข้อด้านบน |
| Stripe webhook บน production | ต้อง URL สาธารณะ + secret |
| Forgot password อีเมลจริง | dev แสดงลิงก์ใน log; production ใช้ Resend |
| CMS | มี `/cms` — ตรวจ flow admin แยกจาก user app |
| Accessibility audit | เป้า WCAG AA ใน `.impeccable.md` |

---

## คำสั่งที่ใช้บ่อย

```bash
npm run dev          # development
npm run build        # production build
npm run start        # หลัง build
npm run db:migrate   # migrate DB
npm run db:seed      # seed oracles + settings
npm run db:studio    # Prisma Studio
npm test             # Vitest (ยังไม่มี test files)
```

---

## อ้างอิง

- Auth flags: `src/lib/auth-providers.ts`
- Design context: `.impeccable.md`
- Cursor rule (AI จดจำ): `.cursor/rules/mahamordo.mdc`
