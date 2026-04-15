import type { Metadata } from 'next'
import './globals.css'
import Navigation from '@/components/Navigation'
import BottomNav from '@/components/BottomNav'

export const metadata: Metadata = {
  title: 'OpenAA 华人生活',
  description: '美国华人二手交易和招聘平台',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>
        <Navigation />
        <main className="pb-20 md:pb-0 min-h-screen">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  )
}
