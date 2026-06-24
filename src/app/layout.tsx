import type { Metadata, Viewport } from 'next'
import { Bebas_Neue, Cinzel, Prompt } from 'next/font/google'
import PdpaBanner from '@/components/legal/PdpaBanner'
import './globals.css'

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
})

const cinzel = Cinzel({
  weight: ['400', '600'],
  subsets: ['latin'],
  variable: '--font-cinzel',
  display: 'swap',
})

const prompt = Prompt({
  weight: ['300', '400'],
  style: ['normal', 'italic'],
  subsets: ['latin', 'thai'],
  variable: '--font-prompt',
  display: 'swap',
})

// Canonical site URL: prefer explicit env, fall back to production domain.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://mahamordo.com'

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // No `template` here — existing pages already include the brand in their
  // titles. Each page's `title` fully overrides this default.
  title: 'มาหาหมอดู MAHAMORDO — ดูดวงออนไลน์ AI โหราศาสตร์ไทย ซาจูเกาหลี ทาโรต์',
  description:
    'ดูดวงออนไลน์กับ AI หมอดู 3 สำนัก: โหราศาสตร์ไทย (นพเคราะห์), ซาจูเกาหลี (사주팔자) และไพ่ทาโรต์ — แม่นยำ ละเอียด ปรึกษาความรัก การงาน การเงิน สุขภาพ ตอบทุกคำถามแบบส่วนตัว',
  applicationName: 'MAHAMORDO',
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
    'โหราศาสตร์ไทย',
    'นพเคราะห์',
    'ดูดวงความรัก',
    'ดูดวงการงาน',
    'ดูดวงการเงิน',
    'ดูดวงราหู',
    'หมอดู AI',
    'ดูดวงด้วย AI',
    'ดวงชะตา',
    'ดวงเกิด',
    'มาหาหมอดู',
    'MAHAMORDO',
  ],
  authors: [{ name: 'MAHAMORDO' }],
  creator: 'MAHAMORDO',
  publisher: 'MAHAMORDO',
  category: 'lifestyle',
  alternates: {
    canonical: '/',
    languages: {
      'th-TH': '/',
      'x-default': '/',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'th_TH',
    url: SITE_URL,
    siteName: 'มาหาหมอดู MAHAMORDO',
    title: 'มาหาหมอดู MAHAMORDO — ดูดวงออนไลน์ AI โหราศาสตร์ไทย ซาจูเกาหลี ทาโรต์',
    description:
      'ดูดวงออนไลน์กับ AI หมอดู 3 สำนัก: โหราศาสตร์ไทย (นพเคราะห์), ซาจูเกาหลี (사주팔자) และไพ่ทาโรต์ — ตอบทุกคำถามเรื่องความรัก การงาน การเงิน สุขภาพ',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'มาหาหมอดู MAHAMORDO — ดูดวงออนไลน์ AI',
    description:
      'ดูดวงออนไลน์กับ AI หมอดู 3 สำนัก: โหราศาสตร์ไทย, ซาจูเกาหลี และทาโรต์',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  // Search engine ownership verification — values pulled from env so the
  // tokens don't get committed. Each is optional; leave the env var unset to
  // skip rendering that particular meta tag.
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    yandex: process.env.YANDEX_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION
      ? { 'msvalidate.01': process.env.BING_SITE_VERIFICATION }
      : undefined,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="th"
      className={`${bebasNeue.variable} ${cinzel.variable} ${prompt.variable}`}
    >
      <body>
        {children}
        <PdpaBanner />
      </body>
    </html>
  )
}
