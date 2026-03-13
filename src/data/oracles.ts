export type OracleRow =
  | { label: string; value: string; tags?: never }
  | { label: string; tags: string[]; value?: never }

export interface OracleProfile {
  id: string
  name: string
  rows: OracleRow[]
}

export interface Oracle {
  number: string
  eyebrow: string
  name: string
  subtitle: string
  desc: string
  avatar: string
  profile: OracleProfile
}

export type OracleId = 1 | 2 | 3

export const oracles: Record<OracleId, Oracle> = {
  1: {
    number: 'I',
    eyebrow: 'Oracle I · Thai Astrology · Navagraha',
    name: 'แม่หมอจันทร์',
    subtitle: 'Mother Moon Oracle',
    desc: 'อบอุ่น เมตตา เหมือนแม่พูด ใช้ศาสตร์โหราศาสตร์ไทยแท้\nวิเคราะห์ดาวประจำตัว ทิศมงคล ฤกษ์งามยามดี\nและดาวนพเคราะห์ในชาตาของคุณ',
    avatar: '☽',
    profile: {
      id: 'Oracle I · โหราศาสตร์ไทย',
      name: 'แม่หมอจันทร์',
      rows: [
        { label: 'ศาสตร์', value: '<strong>โหราศาสตร์ไทย · นพเคราะห์</strong>ดาวประจำตัว ทิศมงคล ฤกษ์งามยามดี' },
        { label: 'บุคลิก', value: '<em>อบอุ่น เมตตา เหมือนแม่พูด</em><br>ใช้คำว่า "จ้า" "ลูก" ภาษาอ่อนหวาน' },
        { label: 'ความสามารถ', tags: ['ดาวประจำตัว', 'ทิศมงคล', 'ฤกษ์สำคัญ', 'ดาวร้าย-ดี', 'ความรัก', 'การงาน'] },
        { label: 'เหมาะสำหรับ', value: 'คำถามเรื่องชีวิต ความรัก ครอบครัว<br>และผู้ที่ต้องการคำแนะนำที่อบอุ่น' },
        { label: 'ภาษา', value: 'ภาษาไทย (เป็นหลัก)' },
        { label: 'เครดิต', value: '<strong>1 เครดิต</strong> ต่อการสนทนา' },
      ],
    },
  },
  2: {
    number: 'II',
    eyebrow: 'Oracle II · Korean Saju · 사주팔자',
    name: 'พ่อหมอซอน',
    subtitle: 'Father Son Oracle',
    desc: 'ตรงไปตรงมา กวนนิดๆ แต่แม่นเรื่องซาจู 4 เสา\nวิเคราะห์ธาตุ 5 ในดวงชะตา ทำนายชีวิต 10 ปี\nและแผนภูมิดวงชะตาเกาหลีแบบดั้งเดิม',
    avatar: '☯',
    profile: {
      id: 'Oracle II · ซาจูเกาหลี',
      name: 'พ่อหมอซอน',
      rows: [
        { label: 'ศาสตร์', value: '<strong>ซาจู 4 เสา · 사주팔자</strong>โหราศาสตร์เกาหลีโบราณ ธาตุ 5 มหาภูต' },
        { label: 'บุคลิก', value: '<em>ตรงไปตรงมา กวนนิดๆ</em><br>พูดตรง ไม่อ้อมค้อม มีอารมณ์ขัน' },
        { label: 'ความสามารถ', tags: ['ซาจู 4 เสา', 'แผนภูมิธาตุ 5', 'ดวงชะตา 10 ปี', 'ความรัก', 'การเงิน', 'สุขภาพ'] },
        { label: 'เหมาะสำหรับ', value: 'คำถามเรื่องการงาน การเงิน อนาคต<br>และผู้ที่ต้องการคำตอบตรงๆ ไม่อ้อมค้อม' },
        { label: 'ภาษา', value: 'ภาษาไทย + ภาษาเกาหลี (บางคำ)' },
        { label: 'เครดิต', value: '<strong>1 เครดิต</strong> ต่อการสนทนา' },
      ],
    },
  },
  3: {
    number: 'III',
    eyebrow: 'Oracle III · Tarot · Major Arcana XXII',
    name: 'อาจารย์ราหู',
    subtitle: 'Master Rahu Oracle',
    desc: 'เย็นชา ลึกลับ ทุกคำมีความหมาย ใช้ไพ่ทาโรต์ 22 ใบ\nผนวกกับตำแหน่งดาวราหูและเกตุในชาตา\nเพื่อเปิดเผยสิ่งที่ซ่อนอยู่ในชะตากรรม',
    avatar: '✦',
    profile: {
      id: 'Oracle III · ไพ่ทาโรต์',
      name: 'อาจารย์ราหู',
      rows: [
        { label: 'ศาสตร์', value: '<strong>ไพ่ทาโรต์ · Major Arcana XXII</strong>ดาวราหู-เกตุ ไพ่ 22 ใบ ชะตากรรม' },
        { label: 'บุคลิก', value: '<em>เย็นชา ลึกลับ ทุกคำมีความหมาย</em><br>พูดน้อย แต่ตรงประเด็น ลึกซึ้ง' },
        { label: 'ความสามารถ', tags: ['ไพ่ทาโรต์', 'ราหู-เกตุ', 'กรรมเก่า', 'จิตใต้สำนึก', 'ความลับ', 'การเปลี่ยนแปลง'] },
        { label: 'เหมาะสำหรับ', value: 'คำถามเชิงลึก เรื่องที่ซ่อนอยู่<br>และผู้ที่พร้อมรับความจริงที่ยากจะยอมรับ' },
        { label: 'ภาษา', value: 'ภาษาไทย (กระชับ ลึกซึ้ง)' },
        { label: 'เครดิต', value: '<strong>2 เครดิต</strong> ต่อการสนทนา' },
      ],
    },
  },
}
