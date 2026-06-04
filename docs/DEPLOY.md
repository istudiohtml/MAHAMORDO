# MAHAMORDO — Deploy Guide

ขั้นตอน deploy ระบบขึ้น production (Hostinger / VPS / Docker / Vercel)

> **สั้นที่สุด:** Next.js 16 + Prisma + **MySQL 8** + เก็บไฟล์รูปบน disk → ใช้
> **Hostinger Business (Node.js Application)**, **VPS (DigitalOcean / Hetzner / Hostinger VPS)**,
> หรือ Docker ก็ได้; ถ้าจะใช้ Vercel ต้องย้าย uploads ไป object storage ก่อน
>
> **Hostinger Business เฉพาะ:** ดู [`DEPLOY_HOSTINGER.md`](./DEPLOY_HOSTINGER.md)

---

## 1. เลือก hosting

| Option | เหมาะกับ | ข้อระวัง |
|--------|----------|----------|
| **Hostinger Business** (Node.js Application) ✅ ราคาถูก | shared hosting + MySQL ในแพลนเดียว | ต้องเปิด Node.js Application ใน hPanel; เก็บ uploads ใน path ที่ persistent (`~/data/uploads`) — ดู [`DEPLOY_HOSTINGER.md`](./DEPLOY_HOSTINGER.md) |
| **VPS (DigitalOcean / Hetzner / Hostinger KVM VPS)** | full control + persistent disk | ต้องดูแล server เอง (PM2 / systemd / nginx) |
| **Docker บน VPS** | reproducible deploy | mount volume สำหรับ uploads + DB |
| **Vercel** | deploy ง่ายสุด | **ต้องย้าย uploads ไป S3/R2/Supabase ก่อน** (filesystem readonly) |
| **Railway / Render** | จัดการ DB+app ในที่เดียว | persistent disk ขึ้นกับ tier |

ที่นี่จะอธิบาย flow **VPS** เป็นหลัก — สำหรับ **Hostinger Business** ดูคู่มือเฉพาะที่ [`DEPLOY_HOSTINGER.md`](./DEPLOY_HOSTINGER.md)

---

## 2. Production checklist (ก่อนเริ่ม)

- [ ] โดเมน + DNS ชี้มาที่ VPS (`A` record)
- [ ] SSL cert (Let's Encrypt / Cloudflare)
- [ ] **MySQL 8+** (DB เปล่า ๆ ชื่อ `mahamordo` collation `utf8mb4_unicode_ci` หรือใช้ DB managed)
- [ ] Stripe account อยู่ที่ Thailand (ถ้าจะใช้ PromptPay) — เปิด PromptPay ที่ Settings → Payment methods
- [ ] Google Cloud OAuth credentials (production redirect URI)
- [ ] Anthropic + OpenAI API keys (มี billing เปิด)
- [ ] (ทางเลือก) Resend API key สำหรับ email + Cron secret

---

## 3. Setup VPS

### 3.1 ติดตั้ง dependencies

```bash
# Ubuntu 24.04 / 22.04
sudo apt update && sudo apt install -y curl git build-essential

# Node 22 LTS via fnm หรือ nvm
curl -fsSL https://fnm.vercel.app/install | bash
fnm install 22 && fnm use 22

# PM2 (process manager)
npm install -g pm2

# MySQL 8 (ถ้าไม่ได้ใช้ managed DB)
sudo apt install -y mysql-server
sudo mysql_secure_installation
# create app DB + user (ต้องระบุ caching_sha2_password — Prisma ไม่รองรับ sha256_password)
sudo mysql <<'SQL'
CREATE DATABASE mahamordo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE mahamordo_shadow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'mahamordo'@'localhost' IDENTIFIED WITH caching_sha2_password BY 'STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON mahamordo.* TO 'mahamordo'@'localhost';
GRANT ALL PRIVILEGES ON mahamordo_shadow.* TO 'mahamordo'@'localhost';
FLUSH PRIVILEGES;
SQL

# ⚠ ถ้าจะรัน `prisma migrate dev` ใน production (ไม่แนะนำ — ใช้ migrate deploy แทน)
# ต้องสร้าง shadow DB ไว้ก่อน เพราะ user ที่ไม่มีสิทธิ์ CREATE DATABASE จะ fail

# nginx (reverse proxy + SSL)
sudo apt install -y nginx
sudo apt install -y certbot python3-certbot-nginx
```

### 3.2 Clone + build

```bash
sudo mkdir -p /var/www && sudo chown $USER /var/www
cd /var/www
git clone https://github.com/<you>/mahamordo.git
cd mahamordo

npm ci
```

### 3.3 ตั้ง env

```bash
cp .env.example .env
nano .env
```

ค่าที่ต้องใส่สำหรับ production (เปลี่ยนทุกค่า):

```bash
# Database (local MySQL หรือ managed DB)
DATABASE_URL="mysql://mahamordo:STRONG_PASSWORD@127.0.0.1:3306/mahamordo"

# Anthropic — ใช้กับ Q&A + post + article (Haiku)
ANTHROPIC_API_KEY="sk-ant-..."

# OpenAI — รูป AI สำหรับ fortune post + article cover
OPENAI_API_KEY="sk-..."

# JWT — สร้างใหม่: openssl rand -base64 32
JWT_SECRET="..."

# App URL (no trailing slash)
NEXT_PUBLIC_APP_URL="https://your-domain.com"

# Google OAuth (production redirect)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_REDIRECT_URI="https://your-domain.com/api/auth/google/callback"

# Stripe — live keys
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."   # set after creating webhook (3.7)

# Resend (ส่ง email reset password)
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="noreply@your-domain.com"

# Persistent uploads dir (รูป post + article cover)
UPLOAD_DIR="/var/lib/mahamordo/uploads"

# Cron secret (สร้างใหม่: openssl rand -hex 32)
CRON_SECRET="..."
```

### 3.4 สร้าง upload dir

```bash
sudo mkdir -p /var/lib/mahamordo/uploads/posts
sudo mkdir -p /var/lib/mahamordo/uploads/articles
sudo mkdir -p /var/lib/mahamordo/uploads/oracles
sudo chown -R $USER:$USER /var/lib/mahamordo
```

> โฟลเดอร์นี้ **ห้ามอยู่ใต้** repo (จะหายตอน deploy ใหม่)

### 3.5 รัน migrate + seed + build

```bash
npx prisma migrate deploy
npm run db:seed
npm run build
```

### 3.6 PM2 (process manager)

สร้าง `ecosystem.config.cjs` ที่ root:

```javascript
module.exports = {
  apps: [
    {
      name: 'mahamordo',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/mahamordo',
      instances: 1,
      autorestart: true,
      env: { NODE_ENV: 'production', PORT: 3000 },
    },
  ],
}
```

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup        # ทำตามคำสั่งที่มันบอกเพื่อ enable on boot
```

ดู log: `pm2 logs mahamordo` · restart: `pm2 restart mahamordo`

### 3.7 nginx + SSL

`/etc/nginx/sites-available/mahamordo`:

```nginx
server {
    server_name your-domain.com;

    client_max_body_size 20M;   # cover image uploads

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/mahamordo /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d your-domain.com   # SSL อัตโนมัติ
```

### 3.8 Stripe webhook

1. ไป https://dashboard.stripe.com/webhooks → **Add endpoint**
2. URL: `https://your-domain.com/api/webhooks/stripe`
3. Events ที่ต้อง subscribe:
   - `checkout.session.completed`
   - `charge.failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy **Signing secret** (`whsec_...`) → ใส่ `STRIPE_WEBHOOK_SECRET` ใน `.env`
5. `pm2 restart mahamordo`
6. ทดสอบจ่ายเงิน (test card `4242 4242 4242 4242`) → เครดิตควรเพิ่มอัตโนมัติ

### 3.9 Cron บทความรายวัน (optional)

```bash
crontab -e
```

เพิ่ม:

```cron
# เรียกทุกชั่วโมง — แอปจะตรวจเองว่าถึงเวลาที่ตั้งใน /cms/articles/settings หรือยัง
0 * * * * curl -sS -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/cron/articles/daily > /var/log/mahamordo-cron.log 2>&1

# Auto-mark FortuneSession ที่หมดอายุ (24 ชม.) เป็น EXPIRED — แนะนำให้ตั้งทุกชั่วโมง
15 * * * * curl -sS -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/cron/sessions/expire > /var/log/mahamordo-cron.log 2>&1
```

แทน `$CRON_SECRET` ด้วยค่าจริง หรือ export ใน `~/.bashrc` ก่อนเรียก  
ไปเปิดที่ `/cms/articles/settings` → toggle `articles_cron_enabled = true`

---

## 4. Deploy รอบถัดไป (update)

```bash
cd /var/www/mahamordo
git pull
npm ci
npx prisma migrate deploy
npm run build
pm2 restart mahamordo
```

> ถ้ามี migration ใหม่ → `prisma migrate deploy` (ไม่ใช่ `migrate dev`)

---

## 5. Backup

### 5.1 Database

```bash
# Backup
mysqldump -u mahamordo -p --single-transaction --routines mahamordo > backup-$(date +%F).sql

# Restore
mysql -u mahamordo -p mahamordo < backup-2026-05-22.sql
```

### 5.2 Uploads (รูป post/article)

```bash
tar -czf mahamordo-uploads-$(date +%F).tar.gz -C /var/lib/mahamordo uploads
```

Auto cron (รวม DB + uploads):

```cron
0 3 * * * mysqldump -u mahamordo -pSTRONG_PASSWORD --single-transaction --routines mahamordo | gzip > /backups/db-$(date +\%F).sql.gz && tar -czf /backups/uploads-$(date +\%F).tar.gz -C /var/lib/mahamordo uploads
```

---

## 6. Docker (ทางเลือก)

`Dockerfile`:

```dockerfile
FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
EXPOSE 3000
CMD ["npm", "start"]
```

`docker-compose.yml`:

```yaml
services:
  app:
    build: .
    env_file: .env
    ports: ['3000:3000']
    depends_on: [db]
    volumes:
      - mahamordo-uploads:/var/lib/mahamordo/uploads
    environment:
      UPLOAD_DIR: /var/lib/mahamordo/uploads
    restart: unless-stopped

  db:
    image: mysql:8.4
    command: --default-authentication-plugin=caching_sha2_password
    environment:
      MYSQL_DATABASE: mahamordo
      MYSQL_USER: mahamordo
      MYSQL_PASSWORD: STRONG_PASSWORD
      MYSQL_ROOT_PASSWORD: ROOT_STRONG_PASSWORD
    volumes:
      - mahamordo-db:/var/lib/mysql
    restart: unless-stopped

volumes:
  mahamordo-uploads:
  mahamordo-db:
```

หลัง `docker compose up -d` → exec migrate:

```bash
docker compose exec app npx prisma migrate deploy
docker compose exec app npm run db:seed
```

---

## 7. Vercel (ถ้าจำเป็น)

Vercel filesystem เป็น **read-only** ตอน runtime → ต้องย้าย uploads ไป object storage ก่อน

ตัวเลือก:
- **Supabase Storage** (มี `@supabase/supabase-js` ติดตั้งอยู่แล้ว)
- **Cloudflare R2** (S3-compatible)
- **AWS S3**

ต้อง refactor:
- `src/lib/post-storage.ts`
- `src/lib/article-storage.ts`
- `src/lib/oracle-storage.ts`
- routes ที่เสิร์ฟ: `src/app/api/uploads/**`

ส่วน DB ใช้ PlanetScale, Aiven, AWS RDS MySQL, หรือ Hostinger MySQL Remote ได้ — แค่เปลี่ยน `DATABASE_URL`

---

## 8. Post-deploy verification

ทำตาม checklist ใน [`SMOKE_TEST.md`](./SMOKE_TEST.md) อย่างน้อย:

- [ ] เปิดหน้าแรกได้ (`https://your-domain.com`)
- [ ] สมัครสมาชิก + ล็อกอินด้วยอีเมล
- [ ] ล็อกอิน Google
- [ ] ดูดวงจบ 1 รอบ — เห็น Claude AI ตอบ
- [ ] ซื้อเครดิต Stripe test (4242…) → เครดิตเพิ่มอัตโนมัติ
- [ ] ซื้อเครดิตด้วย PromptPay (ถ้าเปิด)
- [ ] CMS `/cms/login` (superadmin จาก seed)
- [ ] สร้างบทความ AI + รูปปก (`/cms/articles/new`)
- [ ] เปิดหน้าสาธารณะ `/articles` + `/articles/[slug]`
- [ ] รูป post/article เปิดผ่าน `https://your-domain.com/api/uploads/...` ได้

---

## 9. Troubleshooting

| ปัญหา | สาเหตุที่เป็นไปได้ |
|------|---------------------|
| 502 Bad Gateway | Node app ไม่ start — `pm2 logs mahamordo` |
| Migration fail | DB ไม่ตรง state — `npx prisma migrate status` |
| รูปไม่ขึ้น | `UPLOAD_DIR` ไม่ตรง / permission ผิด / nginx max body size |
| Stripe เครดิตไม่เพิ่ม | webhook URL ผิด, signing secret ผิด, events ไม่ครบ |
| PromptPay ไม่โผล่ | ยังไม่เปิดที่ Stripe Dashboard, account ไม่ใช่ TH |
| Google login fail | redirect URI ไม่ตรง (https vs http, trailing slash) |
| Cron บทความไม่ทำงาน | `articles_cron_enabled` ปิด, ชั่วโมงไม่ตรง, secret ผิด |

---

## อ้างอิง

- Smoke test: [`SMOKE_TEST.md`](./SMOKE_TEST.md)
- Storage (รายละเอียดเพิ่ม): [`DEPLOY_STORAGE.md`](./DEPLOY_STORAGE.md)
- งานที่เหลือ: [`REMAINING.md`](./REMAINING.md)
