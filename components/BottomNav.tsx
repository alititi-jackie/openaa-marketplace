'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: '首页', icon: '🏠', exact: true },
    { href: '/secondhand', label: '二手', icon: '🛍️', exact: false },
    { href: '/jobs', label: '招聘', icon: '💼', exact: false },
    { href: '/profile', label: '我的', icon: '👤', exact: false },
  ]

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-1 text-xs transition ${
              isActive(item.href, item.exact)
                ? 'text-[#1976d2]'
                : 'text-gray-500'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
