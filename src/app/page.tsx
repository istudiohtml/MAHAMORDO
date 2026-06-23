import type { Metadata } from 'next'
import HomeClient from './HomeClient'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://mahamordo.com'

export const metadata: Metadata = {
  title:
    'ดูดวงออนไลน์ AI · ดูดวงเกาหลี ซาจู · ทาโรต์ · โหราศาสตร์ไทย — มหาหมอดู MAHAMORDO',
  description:
    'ดูดวงออนไลน์กับ AI หมอดู 3 สำนัก: แม่หมอจันทร์ (โหราศาสตร์ไทย นพเคราะห์), พ่อหมอซอน (ดูดวงเกาหลี ซาจู 사주팔자) และอาจารย์ราหู (ไพ่ทาโรต์) — ตอบทุกคำถามเรื่องความรัก การงาน การเงิน สุขภาพ แม่นยำ ละเอียด ปรึกษาได้ทุกวัน',
  keywords: [
    'ดูดวง',
    'ดูดวงออนไลน์',
    'ดูดวงฟรี',
    'ดูดวงเกาหลี',
    'ดูดวงซาจู',
    'ซาจู',
    'ซาจูเกาหลี',
    'Saju',
    '사주팔자',
    'ดูไพ่ทาโรต์',
    'ทาโรต์',
    'Tarot',
    'ดูดวงทาโรต์',
    'โหราศาสตร์ไทย',
    'นพเคราะห์',
    'ดูดวงความรัก',
    'ดูดวงการงาน',
    'ดูดวงการเงิน',
    'ดูดวงสุขภาพ',
    'ดูดวงราหู',
    'ดวงราหู',
    'หมอดู AI',
    'ดูดวงด้วย AI',
    'ดวงชะตา',
    'ดวงเกิด',
    'ดูดวงวันเกิด',
    'มหาหมอดู',
    'MAHAMORDO',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'th_TH',
    url: SITE_URL,
    siteName: 'มหาหมอดู MAHAMORDO',
    title:
      'ดูดวงออนไลน์ AI · ดูดวงเกาหลี ซาจู · ทาโรต์ · โหราศาสตร์ไทย — มหาหมอดู',
    description:
      'AI หมอดู 3 สำนัก: โหราศาสตร์ไทย, ซาจูเกาหลี, ไพ่ทาโรต์ — ปรึกษาความรัก การงาน การเงิน สุขภาพ',
  },
  twitter: {
    card: 'summary_large_image',
    title:
      'ดูดวงออนไลน์ AI · ดูดวงเกาหลี ซาจู · ทาโรต์ — มหาหมอดู',
    description:
      'AI หมอดู 3 สำนัก: โหราศาสตร์ไทย, ซาจูเกาหลี, ไพ่ทาโรต์ — ปรึกษาทุกเรื่องในชีวิต',
  },
}

// JSON-LD: Organization + WebSite (with SearchAction) + Service catalog.
// Helps Google understand the brand and surface a sitelinks search box.
const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'มหาหมอดู MAHAMORDO',
    alternateName: ['MAHAMORDO', 'มหาหมอดู'],
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
    sameAs: [] as string[],
    description:
      'แพลตฟอร์มดูดวงออนไลน์ด้วย AI ผสมโหราศาสตร์ไทย ซาจูเกาหลี และไพ่ทาโรต์',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'มหาหมอดู MAHAMORDO',
    url: SITE_URL,
    inLanguage: 'th-TH',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/articles?tag={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'ดูดวงออนไลน์ด้วย AI',
    provider: {
      '@type': 'Organization',
      name: 'มหาหมอดู MAHAMORDO',
      url: SITE_URL,
    },
    areaServed: { '@type': 'Country', name: 'Thailand' },
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: SITE_URL,
      availableLanguage: ['th', 'en', 'ko'],
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'หมอดู 3 สำนัก',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'แม่หมอจันทร์ — โหราศาสตร์ไทย นพเคราะห์',
            url: `${SITE_URL}/thai-astrology`,
            description:
              'ดูดวงโหราศาสตร์ไทย ดาวประจำตัว ทิศมงคล ฤกษ์งามยามดี ความรัก การงาน',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'พ่อหมอซอน — ดูดวงเกาหลี ซาจู 사주팔자',
            url: `${SITE_URL}/saju`,
            description:
              'ดูดวงเกาหลี ซาจู 4 เสา แผนภูมิธาตุ 5 ทำนายดวงชะตา 10 ปี',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'อาจารย์ราหู — ไพ่ทาโรต์ Major Arcana',
            url: `${SITE_URL}/tarot`,
            description:
              'ดูไพ่ทาโรต์ 22 ใบ ผูกดาวราหู-เกตุในชาตา ค้นหาสิ่งที่ซ่อนอยู่',
          },
        },
      ],
    },
  },
]

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* SEO content readable by crawlers but visually hidden — the rich
          animated landing UI lives inside <HomeClient />. */}
      <h1 className="sr-only">
        ดูดวงออนไลน์ AI — ดูดวงเกาหลี (ซาจู) ไพ่ทาโรต์ และโหราศาสตร์ไทย
      </h1>
      <p className="sr-only">
        มหาหมอดู MAHAMORDO คือแพลตฟอร์มดูดวงออนไลน์ด้วย AI หมอดู 3 สำนัก —
        แม่หมอจันทร์ใช้โหราศาสตร์ไทยและนพเคราะห์,
        พ่อหมอซอนใช้ซาจูเกาหลี (사주팔자) วิเคราะห์ธาตุ 5 และดวงชะตา 10 ปี,
        อาจารย์ราหูใช้ไพ่ทาโรต์ Major Arcana 22 ใบ ปรึกษาเรื่องความรัก
        การงาน การเงิน สุขภาพ ดวงราหู และอนาคตได้ทุกวัน
      </p>
      <HomeClient />
    </>
  )
}
