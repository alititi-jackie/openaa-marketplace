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
    ring: 'ring-blue-100',
  },
  {
    label: '房屋',
    Icon: Home,
    href: '/housing',
    bg: 'bg-emerald-50',
    color: 'text-emerald-500',
    ring: 'ring-emerald-100',
  },
  {
    label: '二手',
    Icon: ShoppingBag,
    href: '/secondhand',
    bg: 'bg-violet-50',
    color: 'text-violet-500',
    ring: 'ring-violet-100',
  },
  {
    label: 'DMV',
    Icon: Car,
    href: '/dmv',
    bg: 'bg-amber-50',
    color: 'text-amber-500',
    ring: 'ring-amber-100',
  },
  {
    label: '新闻',
    Icon: Newspaper,
    href: '/news',
    bg: 'bg-rose-50',
    color: 'text-rose-500',
    ring: 'ring-rose-100',
  },
  {
    label: '导航',
    Icon: Navigation,
    href: '/links',
    bg: 'bg-cyan-50',
    color: 'text-cyan-500',
    ring: 'ring-cyan-100',
  },
  {
    label: '新手指南',
    Icon: BookOpen,
    href: '/guide',
    bg: 'bg-orange-50',
    color: 'text-orange-500',
    ring: 'ring-orange-100',
  },
  {
    label: '本地服务',
    Icon: Wrench,
    href: '/services',
    bg: 'bg-teal-50',
    color: 'text-teal-500',
    ring: 'ring-teal-100',
  },
]

export default function GridMenu() {
  return (
    <div className="mt-4 bg-zinc-50 border-y border-zinc-100 py-5 px-4">
      <div className="grid grid-cols-4 gap-y-4 gap-x-2">
        {menuItems.map(({ label, Icon, href, bg, color, ring }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-2 active:scale-90 transition-transform duration-150"
          >
            <div
              className={`w-[54px] h-[54px] rounded-[18px] ${bg} ring-1 ${ring} flex items-center justify-center shadow-sm`}
            >
              <Icon size={25} className={color} strokeWidth={1.7} />
            </div>
            <span className="text-[11.5px] font-medium text-zinc-600 text-center leading-tight">
              {label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
