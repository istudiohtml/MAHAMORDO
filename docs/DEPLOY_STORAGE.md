# เก็บรูปโพสต์ดูดวงบนเซิร์ฟเวอร์ (DigitalOcean / VPS)

รูปโพสต์ AI **ไม่ใช้ Supabase** — บันทึกลงดิสก์ของเซิร์ฟเวอร์แล้วเสิร์ฟผ่าน API

## โฟลเดอร์

| ตัวแปร | ค่าเริ่มต้น (dev) | คำอธิบาย |
|--------|-------------------|----------|
| `UPLOAD_DIR` | `data/uploads` (ในโปรเจกต์) | โฟลเดอร์หลักเก็บไฟล์ |

ไฟล์รูปอยู่ที่: `{UPLOAD_DIR}/posts/{postId}.png`  
URL ในแอป: `/api/uploads/posts/{postId}.png`

## ตัวอย่าง DigitalOcean Droplet

1. สร้าง volume หรือโฟลเดอร์ถาวร:

```bash
sudo mkdir -p /var/lib/mahamordo/uploads/posts
sudo chown -R $USER:$USER /var/lib/mahamordo
```

2. ใน `.env` บนเซิร์ฟเวอร์:

```bash
UPLOAD_DIR=/var/lib/mahamordo/uploads
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

3. รันแอปด้วย PM2 / systemd — **อย่าลบ** `/var/lib/mahamordo` ตอน deploy ใหม่

4. Backup (แนะนำ):

```bash
tar -czf mahamordo-uploads-$(date +%F).tar.gz -C /var/lib/mahamordo uploads
```

## Docker (ถ้าใช้)

Mount volume เข้า container:

```yaml
volumes:
  - mahamordo-uploads:/var/lib/mahamordo/uploads
environment:
  UPLOAD_DIR: /var/lib/mahamordo/uploads
```

## หมายเหตุ

- โฟลเดอร์ `data/uploads/` ถูก gitignore — ต้อง backup แยกจาก git
- รูปเก่าที่ URL เป็น `/uploads/posts/...` (ใน `public/`) ยังเปิดได้ถ้าไฟล์ยังอยู่; โพสต์ใหม่ใช้ `/api/uploads/posts/...`
