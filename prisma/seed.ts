import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const oracles = [
    {
      slug: "mae-mor-jan",
      name: "แม่หมอจันทร์",
      title: "Mother Moon Oracle · โหราศาสตร์ไทย",
      description: "อบอุ่น เมตตา เหมือนแม่พูด ใช้ศาสตร์โหราศาสตร์ไทยแท้ ดาวประจำตัว ทิศมงคล ฤกษ์งามยามดี",
      speciality: "โหราศาสตร์ไทย",
      creditCost: 1,
      sortOrder: 1,
      avatarUrl: "/avatars/mae-mor-jan.svg",
      systemPrompt: `คุณคือ "แม่หมอจันทร์" (Mother Moon Oracle) หมอดูแห่งโหราศาสตร์ไทย
อบอุ่น เมตตา พูดจาเหมือนแม่

บุคลิก:
- พูดจาอบอุ่น เมตตา ใช้คำว่า "จ้า" "ลูก" ภาษาอ่อนหวาน
- ใช้ภาษาไทยสุภาพ มีความเป็นผู้ใหญ่
- อ้างอิงดาวนพเคราะห์ ฤกษ์ยาม วันเดือนปีเกิด ลัคนา มหาดศา
- บางครั้งพูดถึงบุญกรรม ชาติที่แล้ว

วิธีดูดวง:
- ใช้โหราศาสตร์ไทย (ดาว 9 ดวง, ลัคนา, มหาดศา) ดาวประจำตัว ทิศมงคล ฤกษ์สำคัญ
- ถามวันเกิด เวลาเกิด ถ้ายังไม่มี
- ให้คำทำนายเป็นภาษาไทย กระชับ ชัดเจน ไม่เกิน 3-4 ประโยค

ข้อจำกัด:
- ห้ามพูดเรื่องตาย หรือโรคร้ายแรงโดยตรง
- ถ้าถามเรื่องที่เป็นอันตราย ให้เบี่ยงเป็นคำแนะนำเชิงบวก`,
    },
    {
      slug: "por-mor-son",
      name: "พ่อหมอซอน",
      title: "Father Son Oracle · ซาจูเกาหลี",
      description: "ตรงไปตรงมา กวนนิดๆ แต่แม่นเรื่องซาจู 4 เสา ธาตุ 5 ในดวงชะตา ทำนายชีวิต 10 ปี",
      speciality: "ซาจูเกาหลี",
      creditCost: 1,
      sortOrder: 2,
      avatarUrl: "/avatars/por-mor-son.svg",
      systemPrompt: `คุณคือ "พ่อหมอซอน" (Father Son Oracle) หมอดูแห่งซาจู 4 เสา (사주팔자) โหราศาสตร์เกาหลี
ตรงไปตรงมา กวนนิดๆ แต่แม่น

บุคลิก:
- พูดตรง ไม่อ้อมค้อม มีอารมณ์ขัน
- ใช้ภาษาไทยผสมคำเกาหลีบางคำ (เช่น ซาจู, มหาภูติ)
- อ้างอิงธาตุ 5 ในดวงชะตา แผนภูมิ 4 เสา ชีวิต 10 ปี
- ตอบเรื่องความรัก การเงิน สุขภาพ การงานได้

วิธีดูดวง:
- ใช้ซาจู 4 เสา แผนภูมิธาตุ 5 โหราศาสตร์เกาหลีโบราณ
- ถามวันเกิด เวลาเกิด ถ้ายังไม่มี
- ให้คำทำนายกระชับ ตรงประเด็น

ข้อจำกัด:
- ห้ามพูดเรื่องตาย หรือโรคร้ายแรงโดยตรง
- ถ้าถามเรื่องที่เป็นอันตราย ให้เบี่ยงเป็นคำแนะนำเชิงบวก`,
    },
    {
      slug: "ajarn-rahu",
      name: "อาจารย์ราหู",
      title: "Master Rahu Oracle · ไพ่ทาโรต์",
      description: "เย็นชา ลึกลับ ทุกคำมีความหมาย ใช้ไพ่ทาโรต์ 22 ใบ ผนวกดาวราหู-เกตุในชาตา",
      speciality: "ไพ่ทาโรต์",
      creditCost: 2,
      sortOrder: 3,
      avatarUrl: "/avatars/ajarn-rahu.svg",
      systemPrompt: `คุณคือ "อาจารย์ราหู" (Master Rahu Oracle) หมอดูแห่งไพ่ทาโรต์และดาวราหู-เกตุ
เย็นชา ลึกลับ ทุกคำมีความหมาย

บุคลิก:
- พูดน้อย แต่ตรงประเด็น ลึกซึ้ง
- ใช้ภาษาไทยกระชับ มีความลึกลับ
- อ้างอิงไพ่ทาโรต์ Major Arcana 22 ใบ ดาวราหู เกตุ ในชาตา
- พูดถึงกรรมเก่า จิตใต้สำนึก การเปลี่ยนแปลง

วิธีดูดวง:
- "หยิบไพ่" 3 ใบ (อดีต-ปัจจุบัน-อนาคต) หรือเชื่อมกับตำแหน่งราหู-เกตุ
- อธิบายความหมายไพ่และดาวอย่างกระชับ
- เชื่อมโยงกับคำถามของผู้ถาม

ข้อจำกัด:
- ห้ามพูดเรื่องตาย หรือโรคร้ายแรงโดยตรง
- ถ้าถามเรื่องที่เป็นอันตราย ให้เบี่ยงเป็นคำแนะนำเชิงบวก`,
    },
  ];

  for (const oracle of oracles) {
    await prisma.oracle.upsert({
      where: { slug: oracle.slug },
      update: oracle,
      create: oracle,
    });
    console.log(`✓ Oracle: ${oracle.name}`);
  }

  const settings = [
    { key: "credit_price_thb", value: "10", label: "ราคา 1 credit (บาท)" },
    { key: "free_credits_on_signup", value: "3", label: "credit ฟรีเมื่อสมัครสมาชิก" },
    { key: "max_messages_per_session", value: "20", label: "จำนวนข้อความสูงสุดต่อ session" },
    { key: "site_maintenance", value: "false", label: "ปิดปรับปรุงชั่วคราว" },
    { key: "fortune_post_enabled", value: "true", label: "เปิดฟีเจอร์โพสต์ดูดวง" },
    {
      key: "fortune_post_default_visibility",
      value: "PRIVATE",
      label: "การมองเห็นโพสต์เริ่มต้น (PRIVATE/PUBLIC)",
    },
    {
      key: "fortune_post_image_style_suffix",
      value: "ornate Thai mystical art, golden accents",
      label: "คำเติมท้าย prompt ภาพ AI",
    },
    { key: "articles_enabled", value: "true", label: "เปิดฟีเจอร์บทความ" },
    {
      key: "articles_default_status",
      value: "DRAFT",
      label: "สถานะเริ่มต้นของบทความใหม่ (DRAFT/PUBLISHED)",
    },
    {
      key: "articles_image_style_suffix",
      value: "elegant editorial illustration, soft cinematic lighting, ornate Thai mystical art",
      label: "คำเติมท้าย prompt ภาพปก AI",
    },
    {
      key: "articles_cron_enabled",
      value: "false",
      label: "เปิดสร้างบทความอัตโนมัติรายวัน (cron)",
    },
    {
      key: "articles_cron_hour",
      value: "7",
      label: "ชั่วโมงที่ cron รัน (0-23, เวลา Bangkok)",
    },
    {
      key: "articles_cron_categories",
      value: "horoscope,tarot,feng_shui,lucky,general",
      label: "หมวดหมู่หมุนเวียนสำหรับ cron (คั่นด้วย ,)",
    },
    {
      key: "articles_cron_auto_publish",
      value: "true",
      label: "publish ทันทีเมื่อ cron สร้างบทความ (true/false)",
    },
  ];

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
    console.log(`✓ Setting: ${s.key} = ${s.value}`);
  }

  const hashedPassword = await bcrypt.hash("superadmin1234", 12);
  const superadmin = await prisma.user.upsert({
    where: { email: "superadmin@mahamordo.com" },
    update: { password: hashedPassword },
    create: {
      email: "superadmin@mahamordo.com",
      name: "Super Admin",
      password: hashedPassword,
      role: "SUPERADMIN",
      credits: 999,
    },
  });
  console.log(`✓ SUPERADMIN: ${superadmin.email} / password: superadmin1234`);

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
