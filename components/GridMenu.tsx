import Link from 'next/link'
import {
  Briefcase,
  Home,
  ShoppingBag,
  Car,
  Newspaper,
  Navigation,
  BookOpen,
  Wrench,
} from 'lucide-react'

const menuItems = [
  {
    label: '招聘',
    Icon: Briefcase,
    href: '/jobs',
    bg: 'bg-blue-50',
    color: 'text-blue-500',
  },
  {
    label: '房屋',
    Icon: Home,
    href: '/housing',
    bg: 'bg-emerald-50',
    color: 'text-emerald-500',
  },
  {
    label: '二手',
    Icon: ShoppingBag,
    href: '/secondhand',
    bg: 'bg-violet-50',
    color: 'text-violet-500',
  },
  {
    label: 'DMV',
    Icon: Car,
    href: '/dmv',
    bg: 'bg-amber-50',
    color: 'text-amber-500',
  },
  {
    label: '新闻',
    Icon: Newspaper,
    href: '/news',
    bg: 'bg-rose-50',
    color: 'text-rose-500',
  },
  {
    label: '导航',
    Icon: Navigation,
    href: '/links',
    bg: 'bg-cyan-50',
    color: 'text-cyan-500',
  },
  {
    label: '新手指南',
    Icon: BookOpen,
    href: '/guide',
    bg: 'bg-orange-50',
    color: 'text-orange-500',
  },
  {
    label: '本地服务',
    Icon: Wrench,
    href: '/services',
    bg: 'bg-teal-50',
    color: 'text-teal-500',
  },
]

export default function GridMenu() {
  return (
    <div className="mt-5 bg-white py-6 px-4">
      <div className="grid grid-cols-4 gap-y-5 gap-x-3">
        {menuItems.map(({ label, Icon, href, bg, color }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-2.5 active:scale-95 transition-transform duration-150"
          >
            <div
              className={`w-[62px] h-[62px] rounded-2xl ${bg} flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.09)] border border-white/80`}
            >
              <Icon size={28} className={color} strokeWidth={1.7} />
            </div>
            <span className="text-[12px] font-medium text-zinc-600 text-center leading-tight">
              {label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
