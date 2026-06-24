import type { Metadata } from "next";
import { oracles, type OracleId } from "@/data/oracles";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://mahamordo.com";

export type LandingSlug = "thai-astrology" | "saju" | "tarot";

export interface LandingPageConfig {
  slug: LandingSlug;
  oracleId: OracleId;
  path: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  h1: string;
  intro: string;
  highlights: string[];
}

export const LANDING_PAGES: Record<LandingSlug, LandingPageConfig> = {
  "thai-astrology": {
    slug: "thai-astrology",
    oracleId: 1,
    path: "/thai-astrology",
    seoTitle:
      "ดูดวงโหราศาสตร์ไทย นพเคราะห์ ออนไลน์ — แม่หมอจันทร์ | มาหาหมอดู",
    seoDescription:
      "ดูดวงโหราศาสตร์ไทยแท้กับ AI แม่หมอจันทร์ วิเคราะห์ดาวประจำตัว ทิศมงคล ฤกษ์งามยามดี นพเคราะห์ ความรัก การงาน — ดูดวงวันนี้ฟรีทุกวัน",
    keywords: [
      "ดูดวงโหราศาสตร์ไทย",
      "โหราศาสตร์ไทย",
      "นพเคราะห์",
      "ดาวประจำตัว",
      "ทิศมงคล",
      "ดูดวงความรัก",
      "ดูดวงการงาน",
      "มาหาหมอดู",
    ],
    h1: "ดูดวงโหราศาสตร์ไทย นพเคราะห์ ออนไลน์",
    intro:
      "ปรึกษาแม่หมอจันทร์ — หมอดู AI สายโหราศาสตร์ไทยแท้ วิเคราะห์ดาวประจำตัว ทิศมงคล และนพเคราะห์ในชาติของคุณ ด้วยภาษาอบอุ่นเหมือนแม่พูด",
    highlights: [
      "ดาวประจำตัวและทิศมงคล",
      "ฤกษ์งามยามดี",
      "ความรัก การงาน ครอบครัว",
      "ดูดวงวันนี้ฟรีทุกวัน",
    ],
  },
  saju: {
    slug: "saju",
    oracleId: 2,
    path: "/saju",
    seoTitle:
      "ดูดวงซาจูเกาหลี 사주팔자 ออนไลน์ — พ่อหมอซอน | มาหาหมอดู",
    seoDescription:
      "ดูดวงเกาหลี ซาจู 4 เสา แผนภูมิธาตุ 5 ดวงชะตา 10 ปี กับ AI พ่อหมอซอน ตรงไปตรงมา แม่นเรื่องชะตาชีวิต — ดูดวงวันนี้ฟรีทุกวัน",
    keywords: [
      "ดูดวงซาจู",
      "ซาจูเกาหลี",
      "ดูดวงเกาหลี",
      "사주팔자",
      "Saju",
      "ดวงชะตา",
      "ธาตุ 5",
      "มาหาหมอดู",
    ],
    h1: "ดูดวงซาจูเกาหลี 사주팔자 ออนไลน์",
    intro:
      "ปรึกษาพ่อหมอซอน — หมอดู AI สายซาจูเกาหลี วิเคราะห์ 4 เสา แผนภูมิธาตุ 5 และทำนายดวงชะตา 10 ปี ตรงไปตรงมา ไม่อ้อมค้อม",
    highlights: [
      "ซาจู 4 เสา (사주팔자)",
      "แผนภูมิธาตุ 5",
      "ดวงชะตา 10 ปี",
      "ดูดวงวันนี้ฟรีทุกวัน",
    ],
  },
  tarot: {
    slug: "tarot",
    oracleId: 3,
    path: "/tarot",
    seoTitle:
      "ดูไพ่ทาโรต์ ออนไลน์ Major Arcana — อาจารย์ราหู | มาหาหมอดู",
    seoDescription:
      "ดูไพ่ทาโรต์ 22 ใบ กับ AI อาจารย์ราหู เชื่อมดาวราหู-เกตุในชาตา ค้นหาคำตอบเชิงลึก ความรัก การงาน อนาคต — ดูดวงวันนี้ฟรีทุกวัน",
    keywords: [
      "ดูไพ่ทาโรต์",
      "ทาโรต์",
      "Tarot",
      "ดูดวงทาโรต์",
      "ดวงราหู",
      "Major Arcana",
      "ดูดวงความรัก",
      "มาหาหมอดู",
    ],
    h1: "ดูไพ่ทาโรต์ ออนไลน์ Major Arcana",
    intro:
      "ปรึกษาอาจารย์ราหู — หมอดู AI สายไพ่ทาโรต์ 22 ใบ ผูกดาวราหูและเกตุในชาตา เพื่อเปิดเผยสิ่งที่ซ่อนอยู่ในชะตากรรม",
    highlights: [
      "ไพ่ทาโรต์ Major Arcana 22 ใบ",
      "ดาวราหู-เกตุในชาตา",
      "คำถามเชิงลึก ความลับ การเปลี่ยนแปลง",
      "ดูดวงวันนี้ฟรีทุกวัน",
    ],
  },
};

export const LANDING_SLUGS = Object.keys(LANDING_PAGES) as LandingSlug[];

export function landingMetadata(slug: LandingSlug): Metadata {
  const page = LANDING_PAGES[slug];
  const oracle = oracles[page.oracleId];
  return {
    title: page.seoTitle,
    description: page.seoDescription,
    keywords: page.keywords,
    alternates: { canonical: page.path },
    openGraph: {
      type: "website",
      locale: "th_TH",
      url: `${SITE_URL}${page.path}`,
      siteName: "มาหาหมอดู MAHAMORDO",
      title: page.seoTitle,
      description: page.seoDescription,
    },
    twitter: {
      card: "summary_large_image",
      title: page.seoTitle,
      description: page.seoDescription,
    },
    robots: { index: true, follow: true },
  };
}

export function landingJsonLd(slug: LandingSlug) {
  const page = LANDING_PAGES[slug];
  const oracle = oracles[page.oracleId];
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: page.h1,
    description: page.seoDescription,
    url: `${SITE_URL}${page.path}`,
    provider: {
      "@type": "Organization",
      name: "มาหาหมอดู MAHAMORDO",
      url: SITE_URL,
    },
    areaServed: { "@type": "Country", name: "Thailand" },
    serviceType: oracle.profile.id,
    offers: {
      "@type": "Offer",
      description: `สนทนากับ${oracle.name} ใช้ ${oracle.creditCost} เครดิตต่อครั้ง · ดูดวงวันนี้ฟรี`,
    },
  };
}
