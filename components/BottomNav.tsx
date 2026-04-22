'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Briefcase, Plus, Share2, User } from 'lucide-react'

const leftItems = [
  { href: '/', label: '首页', Icon: Home, exact: true },
  { href: '/jobs', label: '招聘', Icon: Briefcase, exact: false },
]

const rightItems = [
  { href: '/links', label: '分享', Icon: Share2, exact: false },
  { href: '/profile', label: '我的', Icon: User, exact: false },
]

export default function BottomNav() {
  const pathname = usePathname()

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[560px] z-50 bg-white/95 backdrop-blur-sm border-t border-zinc-100 shadow-[0_-6px_24px_rgba(0,0,0,0.08)]">
      <div className="grid grid-cols-5 h-16 items-end pb-2">
        {leftItems.map(({ href, label, Icon, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 transition-colors ${
                active ? 'text-blue-500' : 'text-zinc-400'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}

        {/* Center publish button */}
        <div className="flex flex-col items-center justify-end pb-1">
          <Link href="/publish" className="flex flex-col items-center gap-0.5">
            <div className="-mt-7 w-[58px] h-[58px] rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-xl shadow-blue-400/50 border-[3px] border-white">
              <Plus size={26} className="text-white" strokeWidth={2.8} />
            </div>
            <span className="text-[10px] font-medium text-zinc-400 mt-0.5">发布</span>
          </Link>
        </div>

        {rightItems.map(({ href, label, Icon, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 transition-colors ${
                active ? 'text-blue-500' : 'text-zinc-400'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
