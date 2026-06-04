# Deploy บน Hostinger Business (Node.js Application + MySQL)

คู่มือ deploy **มหาหมอดู** ขึ้น Hostinger Web Hosting แพลน **Business** (มี Node.js Apps + MySQL Databases ในแพลนเดียวกัน)

> **Stack ที่ใช้:** Next.js 16 SSR + Prisma + MySQL 8 + เก็บรูป upload ไว้ที่ home directory
>
> สำหรับ KVM VPS / Cloud / DigitalOcean ดู [`DEPLOY.md`](./DEPLOY.md) แทน

---

## 0. Prerequisites

- โดเมน + DNS ชี้มาที่ Hostinger
- Hostinger **Premium / Business / Cloud Startup** ขึ้นไป (ต้องมี Node.js Apps feature)
- Hostinger MySQL Databases (มากับแพลน)
- API keys: Anthropic, OpenAI, Stripe, Google OAuth, Resend
- SSH key เพิ่มที่ hPanel → Advanced → SSH Access (สะดวกตอน git pull / log)

---

## 1. สร้าง MySQL database

1. เข้า hPanel → **Databases → Management**
2. **Create new database:**
   - Database name: `xxx_mahamordo` (Hostinger จะ prefix username ให้)
   - Username: `xxx_mahamordo`
   - Password: ตั้งให้แข็งแรง (จด หรือ copy ไว้)
   - Character set: **utf8mb4** (default)
3. หลังสร้าง จดค่าเหล่านี้ไว้ใส่ `.env`:
   - `DATABASE_HOST` (มักเป็น `localhost` ถ้า DB อยู่บน server เดียวกัน หรือ `mysql.hostinger.com` ถ้า remote)
   - `DATABASE_NAME`
   - `DATABASE_USER`
   - `DATABASE_PASSWORD`

> **Remote MySQL:** ถ้า Node.js App กับ DB อยู่คนละ server (Hostinger บางแพลน) → เปิด **Databases → Remote MySQL** แล้ว whitelist IP ของ Node app

จะได้ `DATABASE_URL` หน้าตา:

```
mysql://xxx_mahamordo:STRONG_PASSWORD@localhost:3306/xxx_mahamordo
```

---

## 2. สร้าง Node.js Application

1. hPanel → **Advanced → Node.js**
2. **Create Application:**
   - Node.js version: **22.x** (ใหม่สุดที่มี)
   - Application mode: **Production**
   - Application root: `mahamordo` (จะกลายเป็น `~/mahamordo` ที่ home dir)
   - Application URL: เลือกโดเมน (เช่น `mahamordo.com`)
   - Application startup file: `node_modules/next/dist/bin/next` หรือ custom (ดูข้อ 4)
3. กด **Create** → Hostinger จะสร้างโฟลเดอร์ + Passenger config ให้

---

## 3. SSH เข้า server แล้ว clone code

```bash
ssh u123456@your-server.hostinger.host
cd ~/mahamordo

# Clone code (ถ้ายังว่าง)
git clone https://github.com/<you>/mahamordo.git .

# โหลด nvm ที่ Hostinger เตรียมไว้
source ~/nodevenv/mahamordo/22/bin/activate   # path อาจต่างเล็กน้อย ตามที่ hPanel แสดง

# ติดตั้ง deps
npm ci
```

> **Tip:** Hostinger มี script ชื่อ `nodevenv` ที่ activate Node version + ENV เฉพาะแอปนั้น ทุกครั้งที่ ssh เข้ามาให้ source ก่อนเสมอ

---

## 4. ตั้ง environment variables

มี 2 วิธี:

### 4.1 ผ่าน hPanel (แนะนำ — ปลอดภัย)

hPanel → **Advanced → Node.js → Edit** → ส่วน **Environment Variables** กด *Add Variable*  
ใส่ทุกค่าจาก [`.env.example`](../.env.example) เปลี่ยนค่า production ตามจริง

ค่าที่ต้องใส่:

```bash
DATABASE_URL=mysql://xxx_mahamordo:STRONG_PASSWORD@localhost:3306/xxx_mahamordo
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
JWT_SECRET=$(openssl rand -base64 32)
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES_DAYS=7
NEXT_PUBLIC_APP_URL=https://your-domain.com
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://your-domain.com/api/auth/google/callback
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_... (ใส่ทีหลัง — ดูข้อ 9)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@your-domain.com
UPLOAD_DIR=/home/u123456/data/mahamordo-uploads
CRON_SECRET=$(openssl rand -hex 32)
NODE_ENV=production
```

### 4.2 ผ่านไฟล์ `.env`

```bash
cp .env.example .env
nano .env
```

> ⚠ Hostinger Node.js Apps จะอ่านจาก hPanel envs ก่อน — ใช้ `.env` เป็น fallback ตอน dev เท่านั้น
> Next.js 16 จะอ่าน `.env.production.local` อัตโนมัติบน build

---

## 5. สร้าง persistent uploads dir

Hostinger ให้ home directory ที่ persistent — วาง uploads นอก app folder เพื่อไม่ให้หายตอน redeploy

```bash
mkdir -p ~/data/mahamordo-uploads/{posts,articles,oracles}
chmod 755 ~/data/mahamordo-uploads
```

ค่า env ตั้ง:

```
UPLOAD_DIR=/home/u123456/data/mahamordo-uploads
```

(แทน `u123456` ด้วย username Hostinger ของคุณ — ดูจาก `pwd` หลัง ssh เข้า home)

---

## 6. รัน Prisma migrate + seed + build

```bash
cd ~/mahamordo
source ~/nodevenv/mahamordo/22/bin/activate

# Generate Prisma client + apply schema (uses migration files — does NOT need shadow DB)
npx prisma generate
npx prisma migrate deploy

# Seed (oracles, system settings, superadmin user)
npm run db:seed

# Build Next.js
npm run build
```

> ใช้ `migrate deploy` ในการ apply migrations ที่ commit มาแล้วเท่านั้น — ไม่ใช่ `migrate dev`
> เพราะ Hostinger MySQL user ปกติไม่มีสิทธิ์ CREATE DATABASE (ที่ Prisma `migrate dev` ต้องการสำหรับ shadow DB)
>
> ถ้าจำเป็นต้องสร้าง migration ใหม่ → สร้างที่เครื่อง dev local แล้ว `git push` ขึ้น server แล้ว `migrate deploy`

---

## 7. ตั้ง startup file ให้ Next.js

Hostinger ใช้ **Phusion Passenger** เป็น process manager — ต้องสร้างไฟล์ entrypoint เล็กๆ

สร้าง `~/mahamordo/server.js`:

```javascript
// Custom Next.js bootstrap for Hostinger Passenger
const { startServer } = require('next/dist/server/lib/start-server')
const { resolve } = require('path')

const dir = resolve(__dirname)
const port = parseInt(process.env.PORT, 10) || 3000

startServer({
  dir,
  isDev: false,
  hostname: '0.0.0.0',
  port,
  allowRetry: false,
}).catch((err) => {
  console.error(err)
  process.exit(1)
})
```

ที่ hPanel → Node.js Application → **Application startup file** ใส่ `server.js`

กด **Restart**

---

## 8. ตั้ง domain + SSL

1. hPanel → **Hosting → Domains** → ผูกโดเมนกับแอป (ถ้ายังไม่ได้)
2. **SSL** → Install Certificate (Let's Encrypt ฟรี) → Force HTTPS
3. ตรวจ `https://your-domain.com` → ควรเห็นหน้าแรกของมหาหมอดู

---

## 9. Stripe Webhook

1. https://dashboard.stripe.com/webhooks → **Add endpoint**
2. URL: `https://your-domain.com/api/webhooks/stripe`
3. Events:
   - `checkout.session.completed`
   - `charge.failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. คัดลอก **Signing secret** (`whsec_...`) → ใส่ `STRIPE_WEBHOOK_SECRET` ใน hPanel envs
5. กด **Restart** ที่ Node.js Application

---

## 10. Cron jobs

Hostinger มี **Cron Jobs** ใน hPanel → **Advanced → Cron Jobs**

เพิ่ม 2 jobs:

### 10.1 บทความ AI รายวัน

- Schedule: `0 * * * *` (ทุกชั่วโมง — แอปจะตรวจเองว่าถึงเวลาที่ตั้งใน `/cms/articles/settings` หรือยัง)
- Command:
  ```
  curl -sS -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/cron/articles/daily > /dev/null 2>&1
  ```

### 10.2 หมดอายุ session

- Schedule: `15 * * * *` (ทุกชั่วโมง offset 15 นาที)
- Command:
  ```
  curl -sS -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/cron/sessions/expire > /dev/null 2>&1
  ```

แทน `YOUR_CRON_SECRET` ด้วยค่า `CRON_SECRET` ที่ตั้งใน envs

> Settings ของ articles cron เปิดที่ `/cms/articles/settings` → toggle `articles_cron_enabled = true`

---

## 11. Deploy ครั้งถัดไป (update)

```bash
ssh u123456@your-server.hostinger.host
cd ~/mahamordo
source ~/nodevenv/mahamordo/22/bin/activate

git pull
npm ci
npx prisma migrate deploy
npm run build
```

แล้วกด **Restart** ที่ hPanel → Node.js Application

หรือ script สั้นๆ ใส่ใน `~/mahamordo/redeploy.sh`:

```bash
#!/usr/bin/env bash
set -e
cd ~/mahamordo
source ~/nodevenv/mahamordo/22/bin/activate
git pull
npm ci
npx prisma migrate deploy
npm run build
echo "✓ rebuilt — restart via hPanel or run: passenger-config restart-app ~/mahamordo"
```

```bash
chmod +x ~/mahamordo/redeploy.sh
```

---

## 12. Backup

### Database

ผ่าน hPanel → **Files → Backups** (Hostinger สำรองอัตโนมัติทุกสัปดาห์)

หรือ manual:

```bash
mysqldump -u xxx_mahamordo -p --single-transaction xxx_mahamordo \
  | gzip > ~/backups/db-$(date +%F).sql.gz
```

ตั้ง cron job ที่ hPanel:

```
0 3 * * * mysqldump -u xxx_mahamordo -pPASSWORD --single-transaction xxx_mahamordo | gzip > ~/backups/db-$(date +\%F).sql.gz
```

### Uploads

```
0 4 * * * tar -czf ~/backups/uploads-$(date +\%F).tar.gz -C ~/data mahamordo-uploads
```

---

## 13. Troubleshooting

| ปัญหา | สาเหตุที่เป็นไปได้ |
|------|-------------------|
| 502 Bad Gateway / app not loading | startup file ผิด, build ยังไม่เสร็จ — ดู log ที่ hPanel → Node.js Application → Logs |
| Prisma migrate fail (`Can't connect to local MySQL`) | DB host ผิด — ลอง `127.0.0.1` แทน `localhost` หรือใช้ remote host |
| `Unknown authentication plugin 'sha256_password'` | DB user ใช้ legacy plugin — `ALTER USER 'xxx'@'localhost' IDENTIFIED WITH caching_sha2_password BY 'pwd';` (Hostinger ใช้ `caching_sha2_password` เป็น default แล้ว) |
| `migrate dev` fail `User was denied access on the database 'prisma_migrate_shadow_db_...'` | DB user ไม่มีสิทธิ์ CREATE DATABASE — สร้าง shadow DB ไว้ก่อน + grant สิทธิ์เฉพาะตัว แล้วใส่ `SHADOW_DATABASE_URL` ใน envs **หรือ** ใช้ `prisma migrate deploy` แทน (ไม่ใช้ shadow DB) |
| `JSON_VALID` constraint error | MySQL version ต่ำกว่า 5.7 — ต้องใช้ 8+ (ค่าเริ่มต้นของ Hostinger Business คือ 8.0+) |
| รูป upload ไม่ขึ้น | `UPLOAD_DIR` ชี้ผิด หรือ permission ผิด — `chmod -R 755 ~/data/mahamordo-uploads` |
| Stripe webhook 401 | URL ใน Stripe Dashboard ผิด, signing secret ไม่ตรง |
| Cron ไม่รัน | Hostinger จำกัดจำนวน cron — ดูที่ hPanel → Cron Jobs ว่ามีกี่ตัว |
| Build OOM | Hostinger Business RAM น้อย — ลอง `NODE_OPTIONS=--max-old-space-size=512 npm run build` |
| Logs ไม่เห็น | hPanel → Node.js Application → ปุ่ม **View Logs** หรือ `tail -f ~/mahamordo/.next/trace` |

---

## 14. Limitations ของ Hostinger Business

| ข้อจำกัด | Workaround |
|--------|-----------|
| ไม่มี root / sudo | ทุกอย่างต้องอยู่ใน `~/` (home) — `UPLOAD_DIR` วางที่ home OK |
| ไม่ติดตั้ง system package เอง | ถ้าต้องการ `sharp` (มาแล้วใน package.json), `ffmpeg` ฯลฯ ต้องดูว่ารองรับไหม — Hostinger รองรับ npm install native deps |
| RAM/CPU จำกัดตามแพลน | Build อาจช้า, ดูตอน peak load — upgrade Cloud Hosting หรือ VPS ถ้าต้องการ |
| ไม่ได้ตั้ง nginx / SSL เอง | ใช้ Passenger + Let's Encrypt ของ Hostinger (พอ) |
| Persistent disk จำกัดตามแพลน | Business ~200 GB — uploads รูป ~ KB ต่อใบ → รับได้เยอะ |
| Long-running jobs | Hostinger จะ kill process ที่นาน → ใช้ Stripe webhook + cron แทน background worker |

ถ้าโตเกิน Business → ย้ายไป **Hostinger KVM VPS** (ใช้ [`DEPLOY.md`](./DEPLOY.md)) หรือ DigitalOcean

---

## 15. Post-deploy checklist

ทำตาม [`SMOKE_TEST.md`](./SMOKE_TEST.md) อย่างน้อย:

- [ ] เปิด `https://your-domain.com` ได้
- [ ] สมัครสมาชิก + ล็อกอินด้วยอีเมล
- [ ] ล็อกอิน Google
- [ ] ดูดวงจบ 1 รอบ — Claude AI ตอบ
- [ ] ซื้อเครดิต Stripe test (`4242 4242 4242 4242`) → เครดิตเพิ่มอัตโนมัติ
- [ ] CMS `/cms/login` (superadmin จาก seed)
- [ ] สร้างบทความ AI (`/cms/articles/new`) — รูปปก gen ผ่าน DALL-E
- [ ] เปิด `/articles` + `/articles/[slug]` ได้
- [ ] รูปขึ้นที่ `https://your-domain.com/api/uploads/...`
