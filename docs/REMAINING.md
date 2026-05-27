# MAHAMORDO — งานที่เหลือ (Remaining Work)

อัปเดตล่าสุด: 2026-05-22  
ใช้ไฟล์นี้เป็นสารบัญงานค้าง — อัปเดตเมื่อปิดหรือเปิดฟีเจอร์

---

## สถานะโปรเจกต์โดยย่อ

| หมวด | สถานะ |
|------|--------|
| Core app (Next.js + Prisma + Fortune AI) | setup บนเครื่องแล้ว — รัน `npm run dev` |
| Google OAuth | ทำแล้ว — ต้องใส่ credentials |
| **Apple Login** | **ปิดชั่วคราว** — ดูหัวข้อด้านล่าง |
| Stripe payments | โค้ดมี — ต้องตั้งค่า keys + webhook |
| PDPA / Privacy | เสร็จแล้ว — banner + `/pdpa` + `/terms` + `/dashboard/privacy` (export / delete / consent) |
| Unit tests | ยังไม่มีไฟล์ test |
| Git | sync กับ `origin/main` แล้ว |

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
| `OPENAI_API_KEY` | รูปภาพ AI สำหรับโพสต์ดูดวง (DALL-E 3) |
| `NEXT_PUBLIC_APP_URL` | redirect, email links |
| `GOOGLE_*` | Google login |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | ซื้อเครดิต / subscription |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | อีเมล reset password (production) |
| `UPLOAD_DIR` | โฟลเดอร์เก็บรูปโพสต์/รูปปกบทความบนเซิร์ฟเวอร์ — ดู [`docs/DEPLOY_STORAGE.md`](./DEPLOY_STORAGE.md) |
| `CRON_SECRET` | secret สำหรับเรียก `/api/cron/articles/daily` (ตั้ง system cron บน VPS หรือใช้ external pinger) |

---

## Deploy

- ขั้นตอน deploy production ทั้งหมด → [`docs/DEPLOY.md`](./DEPLOY.md)
- Smoke test ก่อน deploy → [`docs/SMOKE_TEST.md`](./SMOKE_TEST.md) (53 ข้อ)
- รายละเอียด storage / uploads → [`docs/DEPLOY_STORAGE.md`](./DEPLOY_STORAGE.md)

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

- [x] `src/lib/oracle-assets.test.ts` (6 unit tests)
- [x] `src/lib/article-*.test.ts` + `markdown.test.ts` (19 unit tests สำหรับบทความ)
- [x] Playwright E2E — `e2e/*.spec.ts` (`npm run test:e2e`)
- [ ] เพิ่ม E2E: Stripe checkout, CMS, forgot-password, **articles list/detail + AI generate**

---

## ฟีเจอร์ที่ยังไม่ทำ / รอ config

| ฟีเจอร์ | หมายเหตุ |
|---------|----------|
| Apple Login | ปิด — ดูหัวข้อด้านบน |
| Stripe webhook บน production | ต้อง URL สาธารณะ + secret |
| Forgot password อีเมลจริง | dev แสดงลิงก์ใน log; production ใช้ Resend |
| CMS | มี `/cms` — ตรวจ flow admin แยกจาก user app |
| Accessibility audit | เป้า WCAG AA ใน `.impeccable.md` |
| Fortune post + AI image | CMS เท่านั้น (`/cms/posts`) — ADMIN/SUPERADMIN; `OPENAI_API_KEY` + `UPLOAD_DIR` |
| Articles / Blog | **เสร็จแล้ว** — CMS `/cms/articles` + หน้าสาธารณะ `/articles`, `/articles/[slug]`; รองรับ AI ร่าง + cron รายวัน (เปิด/ปิดใน `/cms/articles/settings`) |

---

## Articles (Blog) — สรุปการใช้งาน

ระบบบทความสำหรับแสดงบนหน้าเว็บสาธารณะ (`/articles`)

| ส่วน | ที่อยู่ |
|------|---------|
| หน้าสาธารณะ (list) | `/articles` |
| หน้าสาธารณะ (detail) | `/articles/[slug]` |
| CMS list | `/cms/articles` |
| CMS เขียนใหม่ (manual + AI) | `/cms/articles/new` |
| CMS แก้ไข | `/cms/articles/[id]` |
| ตั้งค่า (cron, default status, …) | `/cms/articles/settings` |
| Public API | `GET /api/articles`, `GET /api/articles/[slug]` |
| CMS API | `/api/cms/articles`, `/[id]`, `/generate`, `/settings` |
| รูปปก (public) | `GET /api/uploads/articles/[filename]` |
| Cron รายวัน | `GET/POST /api/cron/articles/daily` (ต้องส่ง `CRON_SECRET`) |

**โหมดสร้างบทความ:**

1. **Manual** — admin เขียนเองทั้งหมด (markdown)
2. **AI** — Claude ร่างให้ + DALL-E 3 สร้างรูปปก (เปิด `OPENAI_API_KEY` ก่อน)
3. **Cron auto** — รันรายวันตามชั่วโมงที่ตั้งใน settings (Bangkok time) หมุนหมวดตาม `articles_cron_categories`

**System cron บน VPS (ตัวอย่าง):**

```cron
# ทุกชั่วโมง ส่งให้แอปตัดสินใจเองว่าถึงเวลาแล้วหรือยัง (`articles_cron_hour`)
0 * * * * curl -s -H "Authorization: Bearer $CRON_SECRET" https://your-domain/api/cron/articles/daily > /dev/null
```

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

- Deploy production: [`docs/DEPLOY.md`](./DEPLOY.md)
- Smoke test: [`docs/SMOKE_TEST.md`](./SMOKE_TEST.md)
- Storage / uploads: [`docs/DEPLOY_STORAGE.md`](./DEPLOY_STORAGE.md)
- Auth flags: `src/lib/auth-providers.ts`
- Design context: `.impeccable.md`
- Cursor rule (AI จดจำ): `.cursor/rules/mahamordo.mdc`
