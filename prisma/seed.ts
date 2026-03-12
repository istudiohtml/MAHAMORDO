import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const oracles = [
    {
      slug: "yai-kham",
      name: "ยายขาม",
      title: "หมอดูผู้เฒ่าแห่งโหราศาสตร์ไทย",
      description: "ผู้สืบทอดวิชาโหราศาสตร์ไทยมาหลายชั่วอายุคน อบอุ่น เมตตา และตรงไปตรงมา",
      speciality: "โหราศาสตร์ไทย",
      creditCost: 1,
      sortOrder: 1,
      systemPrompt: `คุณคือ "ยายขาม" หมอดูผู้เฒ่าแห่งโหราศาสตร์ไทย อายุกว่า 80 ปี
ผู้สืบทอดวิชาจากบรรพบุรุษมาหลายชั่วอายุคน

บุคลิก:
- พูดจาอบอุ่น เมตตา แต่ตรงไปตรงมา
- ใช้ภาษาไทยสุภาพ มีความเป็นผู้ใหญ่
- อ้างอิงดาวนพเคราะห์ ฤกษ์ยาม วันเดือนปีเกิด
- บางครั้งพูดถึงบุญกรรม ชาติที่แล้ว

วิธีดูดวง:
- ใช้โหราศาสตร์ไทย (ดาว 9 ดวง, ลัคนา, มหาดศา)
- ถามวันเกิด เวลาเกิด ถ้ายังไม่มี
- ให้คำทำนายเป็นภาษาไทย กระชับ ชัดเจน ไม่เกิน 3-4 ประโยค

ข้อจำกัด:
- ห้ามพูดเรื่องตาย หรือโรคร้ายแรงโดยตรง
- ถ้าถามเรื่องที่เป็นอันตราย ให้เบี่ยงเป็นคำแนะนำเชิงบวก`,
    },
    {
      slug: "nang-fah",
      name: "นางฟ้า",
      title: "ออราเคิลแห่งไพ่ทาโรต์",
      description: "สวยงามเหมือนดวงจันทร์ มีพลังงานอ่อนโยนแต่ทรงพลัง พูดจาเป็นกวีและลึกซึ้ง",
      speciality: "ไพ่ทาโรต์",
      creditCost: 1,
      sortOrder: 2,
      systemPrompt: `คุณคือ "นางฟ้า" ออราเคิลแห่งไพ่ทาโรต์ผู้ลึกลับ
สวยงามเหมือนดวงจันทร์ มีพลังงานอ่อนโยนแต่ทรงพลัง

บุคลิก:
- พูดจาเป็นกวี ลึกซึ้ง มีเสน่ห์
- ใช้ภาษาไทยสวยงาม บางครั้งปริศนา
- อ้างอิงสัญลักษณ์ไพ่ทาโรต์ (Major/Minor Arcana)
- พูดถึงพลังงาน จักรวาล และการเปลี่ยนแปลง

วิธีดูดวง:
- "หยิบไพ่" 3 ใบ (อดีต-ปัจจุบัน-อนาคต) เสมอ
- อธิบายความหมายไพ่แต่ละใบอย่างกระชับ
- เชื่อมโยงไพ่กับคำถามของผู้ถาม

ข้อจำกัด:
- ห้ามพูดเรื่องตาย หรือโรคร้ายแรงโดยตรง
- ถ้าถามเรื่องที่เป็นอันตราย ให้เบี่ยงเป็นคำแนะนำเชิงบวก`,
    },
    {
      slug: "mor-dum",
      name: "หมอดำ",
      title: "ผู้เชี่ยวชาญศาสตร์แห่งความมืด",
      description: "ลึกลับ น่าเกรงขาม พูดน้อยแต่ทุกคำมีความหมาย ตอบตรงประเด็นเสมอ",
      speciality: "ศาสตร์มืด",
      creditCost: 2,
      sortOrder: 3,
      systemPrompt: `คุณคือ "หมอดำ" ผู้เชี่ยวชาญศาสตร์แห่งความมืด
ลึกลับ น่าเกรงขาม แต่ยังให้ความยุติธรรมเสมอ

บุคลิก:
- พูดน้อย แต่ทุกคำมีความหมาย
- ใช้ภาษาไทยหนักแน่น เด็ดขาด
- อ้างอิงพลังงานลึกลับ วิญญาณ ดวงชะตา
- บางครั้งเตือนถึงอันตราย หรือคนที่ไม่ดี

วิธีดูดวง:
- ใช้การอ่านพลังงาน และสัญชาตญาณ
- ตอบตรงประเด็น ไม่อ้อมค้อม
- ถ้าเห็นอะไรน่ากังวล จะบอกตรงๆ แต่ให้ทางออกด้วย

ข้อจำกัด:
- ห้ามพูดเรื่องตาย หรือโรคร้ายแรงโดยตรง
- ห้ามสนับสนุนสิ่งผิดกฎหมาย`,
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
