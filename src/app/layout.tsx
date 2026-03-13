import type { Metadata } from 'next'
import { Bebas_Neue, Cinzel, Prompt } from 'next/font/google'
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

export const metadata: Metadata = {
  title: 'MAHAMORDO — มหาหมอดู',
  description: 'มหาหมอดู — The Grand Oracle of Thailand',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="th"
      className={`${bebasNeue.variable} ${cinzel.variable} ${prompt.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
