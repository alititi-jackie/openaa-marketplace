import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'

export const metadata: Metadata = {
  title: 'OpenAA – 纽约华人生活圈',
  description: '纽约华人综合服务平台 — 招聘·房屋·二手·DMV·新闻',
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
      <body className="bg-zinc-200">
        <div className="mx-auto max-w-[560px] min-h-screen bg-white relative shadow-[0_0_80px_rgba(0,0,0,0.10)]">
          <Header />
          <main className="pt-14 pb-20">
            {children}
          </main>
          <BottomNav />
        </div>
      </body>
    </html>
  )
}
